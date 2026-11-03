-- Script principal côté serveur : argent, revenus, boutique, Game Pass et achats.
-- Toutes les vérifications (prix, argent disponible...) sont faites ici,
-- jamais côté client : un tricheur ne peut donc pas se donner d'argent.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local DataService = require(script.Parent:WaitForChild("DataService"))

-- Canaux de communication avec le client ----------------------------------

local remotes = Instance.new("Folder")
remotes.Name = "Remotes"

local buyUpgrade = Instance.new("RemoteFunction")
buyUpgrade.Name = "BuyUpgrade"
buyUpgrade.Parent = remotes

local getState = Instance.new("RemoteFunction")
getState.Name = "GetState"
getState.Parent = remotes

local stateChanged = Instance.new("RemoteEvent")
stateChanged.Name = "StateChanged"
stateChanged.Parent = remotes

remotes.Parent = ReplicatedStorage

-- Calculs ------------------------------------------------------------------

local function hasDoubleCash(player: Player): boolean
	return player:GetAttribute("DoubleCash") == true
end

local function incomePerTick(player: Player, data: any): number
	local income = Config.BASE_INCOME
	for id, owned in data.upgrades do
		local upgrade = Config.getUpgrade(id)
		if owned and upgrade then
			income += upgrade.income
		end
	end
	if hasDoubleCash(player) then
		income *= 2
	end
	return income * Config.TICK_SECONDS
end

local function buildState(player: Player, data: any)
	return {
		cash = data.cash,
		upgrades = data.upgrades,
		incomePerSecond = incomePerTick(player, data) / Config.TICK_SECONDS,
		doubleCash = hasDoubleCash(player),
	}
end

local function refresh(player: Player)
	local data = DataService.get(player)
	if not data then
		return
	end
	local leaderstats = player:FindFirstChild("leaderstats")
	local cashValue = leaderstats and leaderstats:FindFirstChild("Argent")
	if cashValue and cashValue:IsA("NumberValue") then
		cashValue.Value = data.cash
	end
end

local function pushState(player: Player)
	local data = DataService.get(player)
	if data then
		refresh(player)
		stateChanged:FireClient(player, buildState(player, data))
	end
end

-- Arrivée / départ des joueurs ------------------------------------------

local function checkGamePass(player: Player)
	if Config.GAMEPASS_DOUBLE_CASH == 0 then
		return
	end
	local ok, owns = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, Config.GAMEPASS_DOUBLE_CASH)
	end)
	player:SetAttribute("DoubleCash", ok and owns == true)
end

local function onPlayerAdded(player: Player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	local cash = Instance.new("NumberValue")
	cash.Name = "Argent"
	cash.Parent = leaderstats
	leaderstats.Parent = player

	checkGamePass(player)
	DataService.load(player)
	pushState(player)
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end

Players.PlayerRemoving:Connect(function(player)
	DataService.release(player)
end)

game:BindToClose(function()
	DataService.saveAll()
end)

-- Boutique -----------------------------------------------------------------

buyUpgrade.OnServerInvoke = function(player: Player, upgradeId: unknown)
	local data = DataService.get(player)
	if not data or type(upgradeId) ~= "string" then
		return false, "Données pas encore prêtes"
	end

	local upgrade = Config.getUpgrade(upgradeId)
	if not upgrade then
		return false, "Objet inconnu"
	end
	if data.upgrades[upgrade.id] then
		return false, "Déjà acheté"
	end
	if data.cash < upgrade.price then
		return false, "Pas assez d'argent"
	end

	data.cash -= upgrade.price
	data.upgrades[upgrade.id] = true
	pushState(player)
	return true, upgrade.name .. " acheté !"
end

getState.OnServerInvoke = function(player: Player)
	local data = DataService.get(player)
	return if data then buildState(player, data) else nil
end

-- Game Pass acheté pendant la partie -----------------------------------

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamePassId, purchased)
	if purchased and gamePassId == Config.GAMEPASS_DOUBLE_CASH then
		player:SetAttribute("DoubleCash", true)
		pushState(player)
	end
end)

-- Produits développeur (achetables plusieurs fois) ---------------------

MarketplaceService.ProcessReceipt = function(receipt)
	local player = Players:GetPlayerByUserId(receipt.PlayerId)
	local data = player and DataService.get(player)
	if not player or not data then
		-- Le joueur est parti : Roblox réessaiera à sa prochaine connexion
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local purchaseId = tostring(receipt.PurchaseId)
	if DataService.hasReceipt(data, purchaseId) then
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end

	local amount = Config.CASH_PRODUCTS[receipt.ProductId]
	if not amount then
		warn("[Main] Produit inconnu :", receipt.ProductId)
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	data.cash += amount
	DataService.addReceipt(data, purchaseId)
	pushState(player)
	DataService.save(player)
	return Enum.ProductPurchaseDecision.PurchaseGranted
end

-- Boucles : revenus et sauvegarde automatique ----------------------------

task.spawn(function()
	while true do
		task.wait(Config.TICK_SECONDS)
		for _, player in Players:GetPlayers() do
			local data = DataService.get(player)
			if data then
				data.cash += incomePerTick(player, data)
				refresh(player)
			end
		end
	end
end)

task.spawn(function()
	while true do
		task.wait(Config.AUTOSAVE_SECONDS)
		for _, player in Players:GetPlayers() do
			task.spawn(DataService.save, player)
		end
	end
end)
