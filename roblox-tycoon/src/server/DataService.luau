--!strict
-- Chargement et sauvegarde des données des joueurs (DataStore).
-- - Réessaie automatiquement en cas d'erreur Roblox
-- - Ne sauvegarde jamais des données qui n'ont pas été chargées correctement
--   (sinon on risquerait d'écraser la progression d'un joueur)

local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local STORE_NAME = "PlayerData_v1"
local MAX_RECEIPTS = 50

export type PlayerData = {
	cash: number,
	upgrades: { [string]: boolean },
	receipts: { string }, -- derniers achats déjà traités (anti double-crédit)
}

local DataService = {}

local cache: { [Player]: PlayerData } = {}
local canSave: { [Player]: boolean } = {}

local store: DataStore? = nil
do
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(STORE_NAME)
	end)
	if ok then
		store = result
	else
		warn("[DataService] DataStore indisponible :", result)
	end
end

local function defaultData(): PlayerData
	return {
		cash = Config.STARTING_CASH,
		upgrades = {},
		receipts = {},
	}
end

local function keyFor(player: Player): string
	return "player_" .. player.UserId
end

local function withRetry<T>(label: string, fn: () -> T): (boolean, T?)
	for attempt = 1, 3 do
		local ok, result = pcall(fn)
		if ok then
			return true, result
		end
		warn(("[DataService] %s : échec %d/3 : %s"):format(label, attempt, tostring(result)))
		if attempt < 3 then
			task.wait(2 ^ attempt)
		end
	end
	return false, nil
end

function DataService.load(player: Player): PlayerData
	local data: PlayerData = defaultData()

	local ok, stored = false, nil
	if store then
		local ds = store
		ok, stored = withRetry("chargement " .. player.Name, function()
			return ds:GetAsync(keyFor(player))
		end)
	end

	if ok then
		if type(stored) == "table" then
			-- On complète les champs manquants (anciennes sauvegardes)
			data.cash = tonumber(stored.cash) or data.cash
			data.upgrades = if type(stored.upgrades) == "table" then stored.upgrades else data.upgrades
			data.receipts = if type(stored.receipts) == "table" then stored.receipts else data.receipts
		end
		canSave[player] = true
	elseif RunService:IsStudio() then
		warn("[DataService] Données non chargées : pense à activer "
			.. "« Enable Studio Access to API Services ». Progression non sauvegardée.")
		canSave[player] = false
	else
		player:Kick("Impossible de charger ta progression. Réessaie dans un instant.")
		canSave[player] = false
	end

	cache[player] = data
	return data
end

function DataService.get(player: Player): PlayerData?
	return cache[player]
end

function DataService.save(player: Player): boolean
	local data = cache[player]
	if not data or not canSave[player] or not store then
		return false
	end
	local ds = store
	local ok = withRetry("sauvegarde " .. player.Name, function()
		ds:SetAsync(keyFor(player), data, { player.UserId })
		return true
	end)
	return ok
end

function DataService.release(player: Player)
	DataService.save(player)
	cache[player] = nil
	canSave[player] = nil
end

function DataService.saveAll()
	local pending = 0
	for player in cache do
		pending += 1
		task.spawn(function()
			DataService.save(player)
			pending -= 1
		end)
	end
	-- On attend la fin des sauvegardes (Roblox laisse ~30 s à la fermeture)
	local deadline = os.clock() + 25
	while pending > 0 and os.clock() < deadline do
		task.wait(0.1)
	end
end

-- Achats : renvoie true si cet achat a déjà été crédité
function DataService.hasReceipt(data: PlayerData, purchaseId: string): boolean
	return table.find(data.receipts, purchaseId) ~= nil
end

function DataService.addReceipt(data: PlayerData, purchaseId: string)
	table.insert(data.receipts, purchaseId)
	while #data.receipts > MAX_RECEIPTS do
		table.remove(data.receipts, 1)
	end
end

return DataService
