//character class
class Character {
    constructor(name, health, attackPower) {
        this.name = name;
        this.health = health;
        this.attackPower = attackPower;
        this.inventory = [];
        this.equipped = { name: 'None', value: 0, type: 'weapon' };
    }
    attack(target) {
        if (!target || target.health <= 0) return "Cannot attack.";
        const randomDamage = Math.floor(Math.random() * 5) - 2;
        const damage = Math.max(1, this.attackPower + randomDamage);
        target.health = target.health - damage;
        if (target.health < 0) target.health = 0;
        return `${this.name} attacks ${target.name} for ${damage} damage.`
    }
    takeDamage(amount) {
        this.health = this.health - amount;
        if (this.health < 0) this.health = 0;

    }
    pickUpItem(item) {
        this.inventory.push(item);
        return `Picked up ${item.name}`
    }
    equipItem(item) {
        if (item.type === 'weapon') {
            this.equipped = item;
            this.attackPower = this.attackPower + item.value;
            return `Equipped ${item.name}.`
        }
        else return `Cannot equip ${item.name}.`
    }
}

//item class
class Item {
    constructor(name, type, value) {
        this.name = name;
        this.type = type;
        this.value = value;
    }
}

//location class
class Location {
    constructor(name, description) {
        this.name = name;
        this.description = description;
        this.itemHere = [];
        this.characterHere = [];
        this.connectedLocations = [];
    }
    enter() {
        return this.description
    }
    search() {
        const items = _.map(this.itemHere, 'name').join(', ');
        const characters = _.map(this.characterHere, 'name').join(', ');
        const connections = _.map(this.connectedLocations, 'name').join(', ');
        return `Items: ${items}\nCharacters: ${characters}\nConnected Locations: ${connections}`;
    }
}

//items
const sword = new Item('Sword', 'weapon', 5);
const enchantedSword = new Item('Enchanted Sword', 'weapon', 10)
const potion = new Item('Healing Potion', 'healing', 10);
const syrup = new Item('Healing Syrup', 'healing', 10);
const herb = new Item('Healing Herb', 'healing', 10);
const diamond = new Item('Dirty Rock', 'wingame', 1)

//characters
const player = new Character('Warrior', 30, 3)
const bandit = new Character('Bandit', 15, 1)
const goblin = new Character('Goblin', 15, 2)
const demon = new Character('Demon', 40, 9)

//locations
const village = new Location('Mountain Village', 'Beautiful village on the mountain.')
const forest = new Location('Dark Forest', 'Dark and gloomy forest.')
const cave = new Location('Death Cave', 'You can only sense EVIL!')

//conneced locations
village.connectedLocations.push(forest);
forest.connectedLocations.push(village, cave);
cave.connectedLocations.push(forest);

//put item in game
village.itemHere.push(potion, sword);
forest.itemHere.push(herb, enchantedSword);
cave.itemHere.push(syrup, diamond);

//put character in game
village.characterHere.push(bandit);
forest.characterHere.push(goblin);
cave.characterHere.push(demon);


let currentLocation = village;
let gameOver = false;
let gameStarted = false;

//game output and information display
const displayOutput = document.getElementById('displayOutput');
const information = document.getElementById('information');

//output display of when command input
function displayOutputMsg(msg) {
    displayOutput.textContent = msg; updateInformation();
}

//location, hp, attackpower, equipped information
function updateInformation() {
    information.textContent = `Location: ${currentLocation.name} | HP: ${player.health} | Attack Power: ${player.attackPower} | Equipped: ${player.equipped.name}`
}

//search command
function searchCommand() {
    displayOutputMsg(currentLocation.search());
}

//inventory command
function inventoryCommand() {
    if (player.inventory.length > 0) {
        const listItems = player.inventory.map(i => i.name).join(', ');
        displayOutputMsg(listItems);
    }
    else {
        displayOutputMsg("Inventory is empty.");
    }
}

//move command
function moveCommand(afterCommand) {
    const location = _.find(currentLocation.connectedLocations, l => l.name.toLowerCase() === afterCommand);
    if (location) {
        currentLocation = location; displayOutputMsg(`You have moved to ${currentLocation.name}.\n${currentLocation.enter()}`);
    }
    else displayOutputMsg(`Can't move to ${afterCommand}.`);
}

//pick-up command
function pickUpCommand(afterCommand) {
    const item = _.find(currentLocation.itemHere, i => i.name.toLowerCase() === afterCommand);
    if (!item) {
        displayOutputMsg(`${afterCommand} is not here.`);
        return;
    }
    if (item.type === 'wingame') {
        const demon = _.find(currentLocation.characterHere, c => c.name === 'Demon');
        if (demon && demon.health > 0) {
            const damage = Math.max(1, demon.attackPower + Math.floor(Math.random() * 3) - Math.floor(Math.random() * 2));
            player.takeDamage(damage);
//game over            
            if (player.health <= 0) {
                gameOver = true;
                displayOutputMsg(`When you go near the Dirty Rock the Demon attacks you for ${damage} damage!\nYou have been defeated. Game Over.`);
                return;
            }
            else {
                displayOutputMsg(`When you go near the Dirty Rock the Demon attacks you for ${damage} damage!`);
                return;
            }
        }
        
    }if (item) {
            const message = player.pickUpItem(item);
            _.remove(currentLocation.itemHere, i => i === item)
            displayOutputMsg(message);
        }
}

//use command
function useCommand(afterCommand) {
    const item = _.find(player.inventory, i => i.name.toLowerCase() === afterCommand);
    if (!item) {
        displayOutputMsg(`${afterCommand} is not in your inventory.`);
        return;
    }
    if (item.type === 'weapon') {
        if (player.equipped) {
            player.attackPower = player.attackPower - player.equipped.value;
            player.inventory.push(player.equipped);
        }
        player.equipItem(item);
        displayOutputMsg(`You have equipped ${item.name}.`);
        _.remove(player.inventory, i => i.name === item.name);
        _.remove(player.inventory, i => i.name === 'None');
    }
    else if (item.type === 'healing') {
        player.health = player.health + item.value;
        if (player.health > 30) { player.health = 30 }
        _.remove(player.inventory, i => i === item);
        displayOutputMsg(`${item.name} restored 10HP.`);
    }
//win the game    
    else if (item.type === 'wingame') {
        gameOver = true;
        displayOutputMsg(`You clean the Dirty Rock and it starts to glow.\nYou have found the Blue Diamond!
            \nCongratulation you have finished the quest! Thank you for playing`)
    }
}

//attack command
function attackCommand(afterCommand) {
    const attackCharacter = _.find(currentLocation.characterHere, c => c.name.toLowerCase() === afterCommand);
    if (!attackCharacter) {
        displayOutputMsg(`${afterCommand} is not found.`)
        return;
    }

    let message = player.attack(attackCharacter);
    if (attackCharacter.health <= 0) {
        _.remove(currentLocation.characterHere, c => c === attackCharacter);
        message = message + `\n${attackCharacter.name} is defeated!`;
        displayOutputMsg(message); return;
    }

    const damage = Math.max(1, attackCharacter.attackPower + Math.floor(Math.random() * 3) - Math.floor(Math.random() * 2));
    player.takeDamage(damage);
    message = message + `\n${attackCharacter.name} attacks back for ${damage} damage.`;
//game over
    if (player.health <= 0) {
        gameOver = true;
        message = message + `\n\nYou have been defeated. Game Over.`;
    }
    displayOutputMsg(message);
}

//command input box 
function commandInput(input) {
    if (gameStarted === false) {
        displayOutputMsg("Press Start Game to play.")
        return;
    }
    if (gameOver === true)
        return;
    const newInput = input.toLowerCase().trim();
    const seperate = newInput.split(' ');
    const command = seperate[0];
    const afterCommand = seperate.slice(1).join(' ').trim();

    if (command === 'search') {
        searchCommand();
    }
    else if (command === 'inventory') {
        inventoryCommand();
    }
    else if (command === 'move') {
        moveCommand(afterCommand);
    }
    else if (command === 'pick-up') {
        pickUpCommand(afterCommand);
    }
    else if (command === 'use') {
        useCommand(afterCommand);
    }
    else if (command === 'attack') {
        attackCommand(afterCommand);
    }
    else {
        displayOutputMsg(`Unknown command: ${command}`);
    }
}

//start button
document.getElementById('beginButton').addEventListener('click', () => {
    gameStarted = true;
    displayOutputMsg(`Games has started.\nYou are in ${currentLocation.name}. ${currentLocation.enter()}\nYour quest is to find the Blue Diamond.`);
    document.getElementById('beginButton').style.display = 'none';
})

//Enter button for the command line to and press the enter
const commandInputBox = document.getElementById('commandInput');
document.getElementById('enterButton').addEventListener('click', () => {
    commandInput(commandInputBox.value);
    commandInputBox.value = '';
});

commandInputBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { // Check if Enter key is pressed
        commandInput(commandInputBox.value);
        commandInputBox.value = ''; // Clear input
    }
});