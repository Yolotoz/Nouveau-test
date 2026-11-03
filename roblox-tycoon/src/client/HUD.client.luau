-- Interface du joueur, pensée pour le téléphone :
-- gros boutons, tailles relatives à l'écran, tout se fait au doigt.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local buyUpgrade = remotes:WaitForChild("BuyUpgrade") :: RemoteFunction
local getState = remotes:WaitForChild("GetState") :: RemoteFunction
local stateChanged = remotes:WaitForChild("StateChanged") :: RemoteEvent

local player = Players.LocalPlayer

local COLORS = {
	background = Color3.fromRGB(24, 24, 32),
	panel = Color3.fromRGB(36, 36, 48),
	text = Color3.fromRGB(245, 245, 250),
	muted = Color3.fromRGB(160, 160, 175),
	accent = Color3.fromRGB(255, 196, 0),
	buy = Color3.fromRGB(46, 196, 110),
	disabled = Color3.fromRGB(80, 80, 95),
}

-- Outils -------------------------------------------------------------------

local SUFFIXES = { "", "K", "M", "B", "T" }
local function formatNumber(n: number): string
	local i = 1
	while math.abs(n) >= 1000 and i < #SUFFIXES do
		n /= 1000
		i += 1
	end
	if i == 1 then
		return tostring(math.floor(n))
	end
	return string.format("%.1f%s", n, SUFFIXES[i])
end

local function make(className: string, props: { [string]: any }, children: { Instance }?): any
	local instance = Instance.new(className)
	for key, value in props do
		(instance :: any)[key] = value
	end
	for _, child in children or {} do
		child.Parent = instance
	end
	return instance
end

local function corner(radius: number?)
	return make("UICorner", { CornerRadius = UDim.new(0, radius or 12) })
end

-- Construction de l'interface -------------------------------------------

local gui = make("ScreenGui", {
	Name = "TycoonHUD",
	ResetOnSpawn = false,
	IgnoreGuiInset = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
})

local cashLabel = make("TextLabel", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 8),
	Size = UDim2.new(0, 220, 0, 44),
	BackgroundColor3 = COLORS.background,
	BackgroundTransparency = 0.15,
	TextColor3 = COLORS.accent,
	Font = Enum.Font.GothamBold,
	TextScaled = true,
	Text = "💰 0",
	Parent = gui,
}, { corner(22), make("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6) }) })

local incomeLabel = make("TextLabel", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 56),
	Size = UDim2.new(0, 220, 0, 22),
	BackgroundTransparency = 1,
	TextColor3 = COLORS.text,
	TextStrokeTransparency = 0.5,
	Font = Enum.Font.GothamMedium,
	TextScaled = true,
	Text = "+0 / s",
	Parent = gui,
})

local shopButton = make("TextButton", {
	AnchorPoint = Vector2.new(1, 1),
	Position = UDim2.new(1, -16, 1, -16),
	Size = UDim2.new(0, 150, 0, 60),
	BackgroundColor3 = COLORS.accent,
	TextColor3 = COLORS.background,
	Font = Enum.Font.GothamBlack,
	TextScaled = true,
	Text = "🛒 Boutique",
	Parent = gui,
}, { corner(16), make("UIPadding", { PaddingTop = UDim.new(0, 10), PaddingBottom = UDim.new(0, 10) }) })

local toast = make("TextLabel", {
	AnchorPoint = Vector2.new(0.5, 0),
	Position = UDim2.new(0.5, 0, 0, 86),
	Size = UDim2.new(0.8, 0, 0, 36),
	BackgroundColor3 = COLORS.background,
	BackgroundTransparency = 0.1,
	TextColor3 = COLORS.text,
	Font = Enum.Font.GothamBold,
	TextScaled = true,
	Visible = false,
	ZIndex = 10,
	Parent = gui,
}, {
	corner(12),
	make("UISizeConstraint", { MaxSize = Vector2.new(360, 36) }),
	make("UIPadding", { PaddingTop = UDim.new(0, 6), PaddingBottom = UDim.new(0, 6) }),
})

local shop = make("Frame", {
	AnchorPoint = Vector2.new(0.5, 0.5),
	Position = UDim2.fromScale(0.5, 0.55),
	Size = UDim2.fromScale(0.92, 0.7),
	BackgroundColor3 = COLORS.background,
	Visible = false,
	Parent = gui,
}, { corner(18), make("UISizeConstraint", { MaxSize = Vector2.new(440, 520) }) })

make("TextLabel", {
	Position = UDim2.new(0, 16, 0, 12),
	Size = UDim2.new(1, -80, 0, 36),
	BackgroundTransparency = 1,
	TextColor3 = COLORS.text,
	Font = Enum.Font.GothamBlack,
	TextScaled = true,
	TextXAlignment = Enum.TextXAlignment.Left,
	Text = "Boutique",
	Parent = shop,
})

local closeButton = make("TextButton", {
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -12, 0, 10),
	Size = UDim2.new(0, 44, 0, 44),
	BackgroundColor3 = COLORS.panel,
	TextColor3 = COLORS.text,
	Font = Enum.Font.GothamBold,
	TextScaled = true,
	Text = "✕",
	Parent = shop,
}, { corner(22), make("UIPadding", { PaddingTop = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8) }) })

local list = make("ScrollingFrame", {
	Position = UDim2.new(0, 12, 0, 64),
	Size = UDim2.new(1, -24, 1, -76),
	BackgroundTransparency = 1,
	BorderSizePixel = 0,
	ScrollBarThickness = 6,
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
	CanvasSize = UDim2.new(),
	Parent = shop,
}, { make("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }) })

-- Lignes de la boutique ----------------------------------------------------

type Row = { button: TextButton, price: number? }
local rows: { [string]: Row } = {}

local function createRow(order: number, title: string, subtitle: string, buttonText: string): TextButton
	local row = make("Frame", {
		LayoutOrder = order,
		Size = UDim2.new(1, -8, 0, 72),
		BackgroundColor3 = COLORS.panel,
		Parent = list,
	}, { corner(12) })

	make("TextLabel", {
		Position = UDim2.new(0, 14, 0, 10),
		Size = UDim2.new(1, -150, 0, 28),
		BackgroundTransparency = 1,
		TextColor3 = COLORS.text,
		Font = Enum.Font.GothamBold,
		TextScaled = true,
		TextXAlignment = Enum.TextXAlignment.Left,
		Text = title,
		Parent = row,
	})
	make("TextLabel", {
		Position = UDim2.new(0, 14, 0, 40),
		Size = UDim2.new(1, -150, 0, 20),
		BackgroundTransparency = 1,
		TextColor3 = COLORS.muted,
		Font = Enum.Font.GothamMedium,
		TextScaled = true,
		TextXAlignment = Enum.TextXAlignment.Left,
		Text = subtitle,
		Parent = row,
	})
	return make("TextButton", {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -10, 0.5, 0),
		Size = UDim2.new(0, 120, 0, 50),
		BackgroundColor3 = COLORS.buy,
		TextColor3 = COLORS.text,
		Font = Enum.Font.GothamBlack,
		TextScaled = true,
		Text = buttonText,
		AutoButtonColor = true,
		Parent = row,
	}, { corner(10), make("UIPadding", { PaddingTop = UDim.new(0, 10), PaddingBottom = UDim.new(0, 10) }) })
end

-- État et mise à jour -------------------------------------------------------

local state = { cash = 0, upgrades = {}, incomePerSecond = 0, doubleCash = false }
local toastToken = 0

local function showToast(message: string)
	toastToken += 1
	local token = toastToken
	toast.Text = message
	toast.Visible = true
	task.delay(2, function()
		if token == toastToken then
			toast.Visible = false
		end
	end)
end

local function render()
	cashLabel.Text = "💰 " .. formatNumber(state.cash)
	incomeLabel.Text = "+" .. formatNumber(state.incomePerSecond) .. " / s" .. (if state.doubleCash then "  (x2)" else "")

	for id, row in rows do
		if row.price == nil then
			continue -- ligne Game Pass, gérée à part
		end
		if state.upgrades[id] then
			row.button.Text = "Acheté"
			row.button.BackgroundColor3 = COLORS.disabled
			row.button.Active = false
		else
			row.button.Text = "💰 " .. formatNumber(row.price)
			row.button.BackgroundColor3 = if state.cash >= row.price then COLORS.buy else COLORS.disabled
			row.button.Active = true
		end
	end

	local passRow = rows["__gamepass"]
	if passRow then
		passRow.button.Text = if state.doubleCash then "Actif" else "Acheter"
		passRow.button.BackgroundColor3 = if state.doubleCash then COLORS.disabled else COLORS.accent
	end
end

local function applyState(newState: any)
	if type(newState) == "table" then
		state = newState
		render()
	end
end

-- Remplissage de la boutique ----------------------------------------------

if Config.GAMEPASS_DOUBLE_CASH ~= 0 then
	local button = createRow(0, "⭐ Argent x2", "Pour toujours, sur tous tes gains", "Acheter")
	rows["__gamepass"] = { button = button, price = nil }
	button.Activated:Connect(function()
		if not state.doubleCash then
			MarketplaceService:PromptGamePassPurchase(player, Config.GAMEPASS_DOUBLE_CASH)
		end
	end)
end

for index, upgrade in Config.UPGRADES do
	local button = createRow(index, upgrade.name, "+" .. formatNumber(upgrade.income) .. " / seconde", "")
	rows[upgrade.id] = { button = button, price = upgrade.price }

	local busy = false
	button.Activated:Connect(function()
		if busy or state.upgrades[upgrade.id] then
			return
		end
		busy = true
		local ok, success, message = pcall(function()
			return buyUpgrade:InvokeServer(upgrade.id)
		end)
		busy = false
		if ok then
			showToast(message or (if success then "Acheté !" else "Achat impossible"))
		else
			showToast("Erreur réseau, réessaie")
		end
	end)
end

-- Événements --------------------------------------------------------------

shopButton.Activated:Connect(function()
	shop.Visible = not shop.Visible
end)
closeButton.Activated:Connect(function()
	shop.Visible = false
end)

stateChanged.OnClientEvent:Connect(applyState)

-- L'argent augmente chaque seconde : on suit la valeur du classement
task.spawn(function()
	local leaderstats = player:WaitForChild("leaderstats")
	local cashValue = leaderstats:WaitForChild("Argent") :: NumberValue
	cashValue.Changed:Connect(function(value)
		state.cash = value
		render()
	end)
end)

gui.Parent = player:WaitForChild("PlayerGui")
render()
applyState(getState:InvokeServer())
