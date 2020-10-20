/*
clearInterval(autoTradeZ);
var autoTradeZ = setInterval(function() {
  gamePage.diplomacy.tradeAll(gamePage.diplomacy.get("zebras"));
  gamePage.craftAll("alloy");
}, 200);
*/

/*
Add in an auto-trade-bcoin to buy when below [] and sell when above []
this.game.calendar.cryptoPrice;
this.game.calendar.cryptoPriceMax;
gamePage.diplomacy.sellEcoin();
gamePage.diplomacy.buyEcoin();
this.game.msg("There was a huge crypto market correction");

if (#coins > 0 && cryptoPrice > 1099) { sellCrypto(); }
if (cryptoPrice < 881) { buyCrypto; }
*/

// These control the button statuses
var autoCheck = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];
var autoName = ['build', 'craft', 'hunt', 'trade', 'praise', 'science', 'upgrade', 'party', 'assign', 'energy', 'bcoin', 'embassy', 'cycle', 'religion', 'unicorn'];
var programBuild = false;

// These will allow quick selection of the buildings which consume energy
var bldSmelter = gamePage.bld.buildingsData[15];
var bldBioLab = gamePage.bld.buildingsData[9];
var bldOilWell = gamePage.bld.buildingsData[20];
var bldFactory = gamePage.bld.buildingsData[22];
var bldCalciner = gamePage.bld.buildingsData[16];
var bldAccelerator = gamePage.bld.buildingsData[24];

// These are the assorted variables
var proVar = gamePage.resPool.energyProd;
var conVar = gamePage.resPool.energyCons;
var deadScript = "Script is dead";
var paperChoice = 'none';
var autoChoice = "farmer";
var cycleChoice = 0;
var secResRatio = 0;
var steamOn = 0;


var buildings = [/*
    // list is autogenerated, looks like:
    ["Catnip Field", "field", false],
    ...
*/];
for (var i=0; i<gamePage.bld.buildingsData.length; i++) {
    var data = gamePage.bld.buildingsData[i];
    if (! data.stages) var label = data.label;
    else var label = data.stages.map(function(x){return x.label}).join(' / ');
    buildings.push([label, data.name, false]);
}

// Group like buildings for menu. Needs to be manual, because it's a judgement call.
var buildGroups = [
    ["Kitten Housing", ["hut", "logHouse", "mansion"]],
    ["Craft Bonuses", ["workshop", "factory"]],
    ["Production", ["field", "pasture", "mine", "lumberMill", "aqueduct", "oilWell", "quarry"]],
    ["Conversion", ["smelter", "biolab", "calciner", "reactor", "accelerator", "steamworks", "magneto"]],
    ["Science", ["library", "academy", "observatory"]],
    ["Storage", ["barn", "harbor", "warehouse"]],
    ["Culture", ["amphitheatre", "chapel", "temple"]],
    ["Other", ["tradepost", "mint", "unicornPasture", /*...*/]],
    ["Megastructures", ["ziggurat", "chronosphere", "aiCore"]],
];
// Add missing buildings to "Other"
for (var i=0; i<buildings.length; i++) {
    if (! buildGroups.map(function(x){return x[1]}).flat().includes(buildings[i][1])) {
        for (var j=0; j<buildGroups.length; j++) {
            if (buildGroups[j][0] == "Other") buildGroups[j][1].push(buildings[i][1]);
        }
    }
}

var spaceBuildings = [/*
    ["Space Elevator", "spaceElevator", false],
    ...
*/];
var spaceGroups = [/*
    ["cath", ["spaceElevator", "sattelite", "spaceStation"]],
    ...
*/];
for (var i=0; i<gamePage.space.planets.length; i++) {
    var planet = gamePage.space.planets[i];
    var inGroup = [];
    for (var j=0; j<planet.buildings.length; j++) {
        var data = planet.buildings[j];
        if (! data.stages) var label = data.label;
        else var label = data.stages.map(function(x){return x.label}).join(' / ');
        spaceBuildings.push([label, data.name, false]);
        inGroup.push(data.name);
    }
    spaceGroups.push([planet.label, inGroup]);
}

var resources = [
    [    "wood", [["catnip", 50]]],
    [    "beam", [["wood", 175]]],
    [    "slab", [["minerals", 250]]],
    [   "steel", [["iron", 100],["coal", 100]]],
    [   "plate", [["iron", 125]]],
    [   "alloy", [["titanium", 10],["steel", 75]]],
    ["kerosene", [["oil", 7500]]],
    [ "thorium", [["uranium", 250]]],
    [ "eludium", [["unobtainium", 1000],["alloy", 2500]]],
    ["scaffold", [["beam", 50]]],
    ["concrate", [["steel", 25],["slab", 2500]]], // sic concrate
    [    "gear", [["steel", 15]]],
    /* These must be last, anything after may be skipped by paperStarts..paperChoice */
    [ "parchment", [["furs",175]]],
    ["manuscript", [["parchment", 20],["culture",300]]],
    [ "compedium", [["manuscript", 50],["science",10000]]], // sic compedium
    [ "blueprint", [["compedium", 25],["science",25000]]]
];
var paperStarts = resources.findIndex(function(r){return r[0]=='parchment'});

var htmlMenuAddition = '<div id="farRightColumn" class="column">' +

'<a id="scriptOptions" onclick="selectOptions()"> | ScriptKitties </a>' +

'<div id="optionSelect" style="display:none; margin-top:-125%; margin-left:-65px; width:200px" class="dialog help">' +
'<a href="#" onclick="clearOptionHelpDiv();" style="position: absolute; top: 10px; right: 15px;">close</a>' +

'<button id="killSwitch" onclick="clearInterval(clearScript()); gamePage.msg(deadScript);">Kill Switch</button> </br>' +
'<button id="efficiencyButton" onclick="kittenEfficiency()">Check Efficiency</button></br></br>' +
'<button id="autoBuild" style="color:red" onclick="autoSwitch(autoCheck[0], 0, autoName[0], \'autoBuild\');"> Auto Build </button></br>' +
'<button id="bldSelect" onclick="selectBuildings()">Select Building</button></br>' +

'<button id="autoAssign" style="color:red" onclick="autoSwitch(autoCheck[8], 8, autoName[8], \'autoAssign\')"> Auto Assign </button>' +
'<select id="autoAssignChoice" size="1" onclick="setAutoAssignValue()">' +
'<option value="woodcutter">Woodcutter</option>' +
'<option value="farmer" selected="selected">Farmer</option>' +
'<option value="scholar">Scholar</option>' +
'<option value="hunter">Hunter</option>' +
'<option value="miner">Miner</option>' +
'<option value="priest">Priest</option>' +
'<option value="geologist">Geologist</option>' +
'<option value="engineer">Engineer</option>' +
'</select></br>' +

'<button id="autoCraft" style="color:red" onclick="autoSwitch(autoCheck[1], 1, autoName[1], \'autoCraft\')"> Auto Craft </button>' +
'<select id="craftFur" size="1" onchange="setFurValue()">' +
'<option value="none" selected="selected">None</option>' +
'<option value="parchment">Parchment</option>' +
'<option value="manuscript">Manuscript</option>' +
'<option value="compedium">Compendium</option>' +
'<option value="blueprint">Blueprint</option>' +
'</select></br>' +
'<label id="secResLabel"> Secondary Craft % </label>' +
'<span id="secResSpan" title="Between 0 and 100"><input id="secResText" type="text" style="width:25px" onchange="secResRatio = this.value" value="' + secResRatio + '"></span></br></br>' +


'<button id="autoHunt" style="color:red" onclick="autoSwitch(autoCheck[2], 2, autoName[2], \'autoHunt\')"> Auto Hunt </button></br>' +
'<button id="autoTrade" style="color:red" onclick="autoSwitch(autoCheck[3], 3, autoName[3], \'autoTrade\')"> Auto Trade </button></br>' +
'<button id="autoPraise" style="color:red" onclick="autoSwitch(autoCheck[4], 4, autoName[4], \'autoPraise\')"> Auto Praise </button></br>' +
'<button id="autoParty" style="color:red" onclick="autoSwitch(autoCheck[7], 7, autoName[7], \'autoParty\')"> Auto Party </button></br>' +
'<br>' +

'<button id="autoEmbassy" style="color:red" onclick="autoSwitch(autoCheck[11], 11, autoName[11], \'autoEmbassy\')"> Auto Embassy </button></br>' +
'<button id="autoCycle" style="color:red" onclick="autoSwitch(autoCheck[12], 12, autoName[12], \'autoCycle\')"> Auto Cycle </button></br>' +
'<select id="cycleChoice" size="1" onchange="setCycleChoice()">';
for (var i = 0; i < game.calendar.cycles.length; i++) {
    var cycle = game.calendar.cycles[i];
    var sel = (i==0) ? ' selected="selected"' : '';
    var label = `${cycle.glyph} ${cycle.title}`;
    htmlMenuAddition += `<option value="${i}"${sel}>${label}</option>`;
}
htmlMenuAddition += '</select></br>' +
'</br>' +

'<button id="autoScience" style="color:red" onclick="autoSwitch(autoCheck[5], 5, autoName[5], \'autoScience\')"> Auto Science </button></br>' +
'<button id="autoUpgrade" style="color:red" onclick="autoSwitch(autoCheck[6], 6, autoName[6], \'autoUpgrade\')"> Auto Upgrade </button></br>' +
'<button id="autoReligion" style="color:red" onclick="autoSwitch(autoCheck[13], 13, autoName[13], \'autoReligion\')"> Auto Religion </button></br>' +
'<button id="autoUnicorn" style="color:red" onclick="autoSwitch(autoCheck[14], 14, autoName[14], \'autoUnicorn\')"> Auto Unicorn </button></br>' +
'<button id="autoEnergy" style="color:red" onclick="autoSwitch(autoCheck[9], 9, autoName[9], \'autoEnergy\')"> Energy Control </button></br>' +
'<button id="autoBCoin" style="color:red" onclick="autoSwitch(autoCheck[10], 10, autoName[10], \'autoBCoin\')"> Auto BCoin </button></br>' +
'</div>' +
'</div>'
$("#footerLinks").append(htmlMenuAddition);


var bldSelectAddition = '<div id="buildingSelect" style="display:none; margin-top:0px; top:50% !important; transform:translateY(-50%); width:400px; -webkit-columns: 100px 2; -webkit-column-gap: 20px; -webkit-column-rule: 4px double #DE8D47;" class="dialog help">' +
    '<a href="#" onclick="$(\'#spaceSelect\').toggle(); $(\'#buildingSelect\').hide();" style="position: absolute; top: 10px; left: 15px;">space</a>' +
    '<a href="#" onclick="$(\'#buildingSelect\').hide();" style="position: absolute; top: 10px; right: 15px;">close</a>' +
    '<br>';
bldSelectAddition += buildMenu(buildGroups, buildings, 'buildings');
bldSelectAddition += '</div>';


var spaceSelectAddition = '<div id="spaceSelect" style="display:none; margin-top:0px; top:50% !important; transform:translateY(-50%); width:200px" class="dialog help">' +
    '<a href="#" onclick="$(\'#spaceSelect\').hide(); $(\'#buildingSelect\').toggle();" style="position: absolute; top: 10px; left: 15px;">cath</a>' +
    '<a href="#" onclick="$(\'#spaceSelect\').hide();" style="position: absolute; top: 10px; right: 15px;">close</a>' +
    '	</br></br><input type="checkbox" id="programs" class="programs" onchange="programBuild = this.checked; console.log(this.checked);"><label for="programs">Programs</label></br></br>';
spaceSelectAddition += buildMenu(spaceGroups, spaceBuildings, 'spaceBuildings');
spaceSelectAddition += '</div>';

function buildMenu(groups, elements, elementsName) {
    var menu = '';
    for (var i = 0; i < groups.length; i++) {
        var label = groups[i][0];
        var lab = label.substring(0,3); // used for prefixes, "lab" is prefix of "label"
        menu += `	<input type="checkbox" id="${lab}Checker" onclick="selectChildren(\'${lab}Checker\',\'${lab}Check\');"><label for="${lab}Checker"><b>${label}</b></label><br>`;

        for (var j = 0; j < groups[i][1].length; j++) {
            var bld = groups[i][1][j];
            for (var k = 0; k < elements.length; k++) {
                if (bld == elements[k][1]) {
                    bldLabel = elements[k][0];
                    bldNum = k;
                    break;
                }
            }
            menu += `	<input type="checkbox" id="${bld}" class="${lab}Check" onchange="verifyElementSelected(\'${bld}\',${elementsName})"><label for="${bld}"> ${bldLabel}</label><br>`;
        }
        menu += '<br>';
    }
    return menu;
}

function selectChildren(checker, checkee) {
    $('.'+checkee).prop('checked', document.getElementById(checker).checked).change();
}

function verifyElementSelected(id, elements) {
    var isChecked = document.getElementById(id).checked;
    for (var i=0; i<elements.length; i++) {
        if (elements[i][1] == id) {
            elements[i][2] = isChecked;
            return;
        }
    }
}

$("#game").append(bldSelectAddition);
$("#game").append(spaceSelectAddition);

function clearOptionHelpDiv() {
    $("#optionSelect").hide();
}

function selectOptions() {
    $("#optionSelect").toggle();
}

function clearHelpDiv() {
    $("#buildingSelect").hide();
}

function selectBuildings() {
    $("#buildingSelect").toggle();
}

function setFurValue() {
    paperChoice = $('#craftFur').val();
}

function setAutoAssignValue() {
    autoChoice = $('#autoAssignChoice').val();
}

function setCycleChoice() {
    cycleChoice = parseInt($('#cycleChoice').val());
}

function autoSwitch(varCheck, varNumber, textChange, varName) {
    if (varCheck == false) {
        autoCheck[varNumber] = true;
        gamePage.msg('Auto' + textChange + ' is now on');
        document.getElementById(varName).style.color = 'black';
    } else if (varCheck == true) {
        autoCheck[varNumber] = false;
        gamePage.msg('Auto' + textChange + ' is now off');
        document.getElementById(varName).style.color = 'red';
    }
}

function clearScript() {
    $("#farRightColumn").remove();
    $("#buildingSelect").remove();
    $("#spaceSelect").remove();
    $("#scriptOptions").remove();
    clearInterval(runAllAutomation);
    autoBuildCheck = null;
    bldSelectAddition = null;
    spaceSelectAddition = null;
    htmlMenuAddition = null;
}

// Show current kitten efficiency in the in-game log
function kittenEfficiency() {
    var secondsPlayed = game.calendar.trueYear() * game.calendar.seasonsPerYear * game.calendar.daysPerSeason * game.calendar.ticksPerDay / game.ticksPerSecond;
    var numberKittens = gamePage.resPool.get('kittens').value;
    var curEfficiency = (numberKittens - 70) / (secondsPlayed / 3600);
    gamePage.msg("Your current efficiency is " + parseFloat(curEfficiency).toFixed(2) + " Paragon per hour.");
}


/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */
/* These are the functions which are controlled by the runAllAutomation timer */


// Auto Observe Astronomical Events
function autoObserve() {
    var checkObserveBtn = document.getElementById("observeBtn");
    if (typeof(checkObserveBtn) != 'undefined' && checkObserveBtn != null) {
        document.getElementById('observeBtn').click();
    }
}

// Auto praise the sun
function autoPraise() {
    if (autoCheck[4] != false && gamePage.bld.getBuildingExt('temple').meta.val > 0) {
        gamePage.religion.praise();
    }
}

// Build buildings automatically
function autoBuild() {
    if (autoCheck[0] != false && gamePage.ui.activeTabId == 'Bonfire') {
        var btn = gamePage.tabs[0].buttons;

        for (var z = 0; z < buildings.length; z++) {
            if (buildings[z][2] != false && gamePage.bld.getBuildingExt(buildings[z][1]).meta.unlocked) {
                for (i = 2; i < gamePage.tabs[0].buttons.length; i++) {
                    if (btn[i].model.metadata.name == buildings[z][1]) {
                        try {
                            btn[i].controller.buyItem(btn[i].model, {}, function(result) {
                                if (result) {btn[i].update();}
                            });
                        } catch(err) {
                            console.log(err);
                        }
                    }
                }
            }
        }
        if (gamePage.getResourcePerTick('coal') > 0.01 && steamOn < 1) {
            gamePage.bld.getBuildingExt('steamworks').meta.on = gamePage.bld.getBuildingExt('steamworks').meta.val;
            steamOn = 1;
        }
    }
}

// Build space stuff automatically
function autoSpace() {
    if (autoCheck[0] != false && gamePage.tabs[6] && gamePage.tabs[6].planetPanels) {
        var origTab = gamePage.ui.activeTabId;

        // Build space buildings
        outer: for (var z = 0; z < spaceBuildings.length; z++) {
            if (spaceBuildings[z][2] != false && gamePage.space.getBuilding(spaceBuildings[z][1]).unlocked) {

                for (i = 0; i < gamePage.tabs[6].planetPanels.length; i++) {
                    for (j = 0; j < gamePage.tabs[6].planetPanels[i].children.length; j++) {
                        var spBuild = gamePage.tabs[6].planetPanels[i].children[j];
                        if (spaceBuildings[z][1] == spBuild.id) {
                            // .enabled doesn't update automatically unless the tab is active, force it
                            if (! spBuild.model.enabled) spBuild.controller.updateEnabled(spBuild.model);
                            if (spBuild.model.enabled) {
                                spBuild.controller.buyItem(spBuild.model, {}, function(result) {
                                    if (result) {spBuild.update();}
                                });
                            }
                            continue outer;
                        }
                    }
                }
            }
        }

        // Build space programs
        if (programBuild != false && gamePage.tabs[6] && gamePage.tabs[6].GCPanel) {
            var spcProg = gamePage.tabs[6].GCPanel.children;
            for (var i = 0; i < spcProg.length; i++) {
                if (! spcProg[i].model.enabled) spcProg[i].controller.updateEnabled(spcProg[i].model);
                if (spcProg[i].model.metadata.unlocked && spcProg[i].model.on == 0 && spcProg[i].model.enabled) {
                    try {
                        // XXX revisit if above turns out well
                        if (gamePage.ui.activeTabId != "Space") {
                            gamePage.ui.activeTabId = 'Space'; gamePage.render(); // Change the tab so that we can build
                        }

                        spcProg[i].controller.buyItem(spcProg[i].model, {}, function(result) {
                            if (result) {spcProg[i].update();}
                        });
                    } catch(err) {
                        console.log(err);
                    }
                }
            }
        }

        if (origTab != gamePage.ui.activeTabId) {
            gamePage.ui.activeTabId = origTab; gamePage.render();
        }
    }
}

// Trade automatically
function autoTrade() {
    var ticksPerCycle = 25;
    // autoTrade happens every 25 ticks
    if (autoCheck[3] != false) {
        var goldResource = gamePage.resPool.get('gold');
        var goldPerCycle = gamePage.getResourcePerTick('gold') * ticksPerCycle;
        var powerResource = gamePage.resPool.get('manpower');
        var powerPerCycle = gamePage.getResourcePerTick('manpower') * ticksPerCycle;
        var powerPerCycle = Math.min(powerPerCycle, powerResource.value); // don't try to spend more than we have
        var sellCount = Math.floor(Math.min(goldPerCycle/15, powerPerCycle/50));

        if (goldResource.value > (goldResource.maxValue - goldPerCycle)) { // don't check catpower
            var titRes = gamePage.resPool.get('titanium');
            var unoRes = gamePage.resPool.get('unobtainium');

            if (unoRes.value > 5000 && gamePage.diplomacy.get('leviathans').unlocked && gamePage.diplomacy.get('leviathans').duration != 0) {
                gamePage.diplomacy.tradeAll(game.diplomacy.get("leviathans"));
            } else if (titRes.value < (titRes.maxValue * 0.9) && gamePage.diplomacy.get('zebras').unlocked) {
                // don't waste the iron, make some space for it.
                var ironRes = gamePage.resPool.get('iron');
                var sellIron = game.diplomacy.get("zebras").sells[0];
                var expectedIron = sellIron.value * sellCount *
                    (1 + (sellIron.seasons ? sellIron.seasons[game.calendar.getCurSeason().name] : 0)) *
                    (1 + game.diplomacy.getTradeRatio() + game.diplomacy.calculateTradeBonusFromPolicies('zebras', game))
                if (ironRes.value > (ironRes.maxValue - expectedIron)) {
                    gamePage.craft('plate', (ironRes.value - (ironRes.maxValue - expectedIron))/125); // 125 is iron per plate
                }

                gamePage.diplomacy.tradeMultiple(game.diplomacy.get("zebras"), sellCount);
            } else if (gamePage.diplomacy.get('dragons').unlocked) {
                gamePage.diplomacy.tradeMultiple(game.diplomacy.get("dragons"), sellCount);
            }
        }
    }
}

// Build Embassies automatically
function autoEmbassy() {
    if (autoCheck[11] != false && gamePage.diplomacyTab.racePanels && gamePage.diplomacyTab.racePanels[0]) {
        var culture = gamePage.resPool.get('culture');
        if (culture.value >= culture.maxValue * 0.99) { // can exceed due to MS usage
            var panels = gamePage.diplomacyTab.racePanels;
            var btn = panels[0].embassyButton;
            for (var z = 1; z < panels.length; z++) {
                var candidate = panels[z].embassyButton;
                if (candidate && candidate.model.prices[0].val < btn.model.prices[0].val) {
                    btn = candidate;
                }
            }
            try {
                btn.controller.buyItem(btn.model, {}, function(result) {
                    if (result) {btn.update();}
                });
            } catch(err) {
                console.log(err);
            }
        }
    }
}

// Hunt automatically
function autoHunt() {
    if (autoCheck[2] != false) {
        var catpower = gamePage.resPool.get('manpower');
        if (catpower.value > (catpower.maxValue - 1)) {
            gamePage.village.huntAll();
        }
    }
}

// Craft primary resources automatically
function autoCraft() {
    /* Note: In this function, rounding gives us grief.
     * If we have enough resource to craft 3.75 of of something, and ask for
     * that, the game rounds up to 4 and then fails because we don't have
     * enough.
     *
     * However, we mostly craft "off the top", making space for production,
     * so we'll usually have the slack. But when we don't, it effectively turns
     * off autoCraft for that resource.
     *
     * On the other hand, we don't want to always round down, or else we'll be
     * wasting resources, and in some cases *cough*eludium*cough*, we'll be
     * rounding down to zero.
     */
    var ticksPerCycle = 3; // we execute every 3 ticks

    if (autoCheck[1] != false) {
        // Craft primary resources
        for (var i = 0; i < resources.length; i++) {
            var output = resources[i][0];
            var inputs = resources[i][1];
            var outRes = gamePage.resPool.get(resources[i][0]);
            if (output == 'parchment' && paperChoice == 'none') break; // user asked for no papers
            if (! outRes.unlocked) continue;

            var craftCount = Infinity
            for (var j = 0; j < inputs.length; j++) {
                var inRes = gamePage.resPool.get(inputs[j][0]);
                craftCount = Math.min(craftCount, Math.floor(inRes.value / inputs[j][1])); // never try to use more than we have

                if (inRes.maxValue != 0) {
                    // primary resource
                    var resourcePerCycle = gamePage.getResourcePerTick(inputs[j][0], 0) * ticksPerCycle;
                    if (resourcePerCycle < inRes.maxValue && inRes.value < (inRes.maxValue - resourcePerCycle)) {
                        craftCount = 0;
                    } else {
                        craftCount = Math.min(craftCount, resourcePerCycle / inputs[j][1]);
                    }
                } else if (i < paperStarts) {
                    // secondary resource
                    var resMath = inRes.value / inputs[j][1];
                    if (resMath <= 1 || outRes.value > (inRes.value * (secResRatio / 100))) craftCount = 0;
                    craftCount = Math.min(craftCount, resMath * (secResRatio / 100));
                } else {
                    // secondary resource: fur, parchment, manuscript, compendium
                    craftCount = Math.min(craftCount, (inRes.value / inputs[j][1]));
                }
            }
            if (craftCount == 0 || craftCount == Infinity) {
                // nothing to do
            } else if (paperChoice == 'blueprint' && output == 'compedium' && gamePage.resPool.get('compedium').value > 25) {
                // save science for making blueprints
            } else {
                gamePage.craft(output, craftCount);
            }
            if (output == paperChoice) break; // i.e. if we're processing the user's choice, then we're done
        }
    }
}

// Auto Research
function autoResearch() {
    if (autoCheck[5] != false && gamePage.libraryTab.visible != false) {
        var buttons = gamePage.libraryTab.buttons;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.metadata.unlocked && buttons[i].model.metadata.researched != true) {
                if ( ! buttons[i].model.enabled) buttons[i].update();
                if (buttons[i].model.enabled) {
                    buttons[i].controller.buyItem(buttons[i].model, {}, function(result) {
                        if (result) {buttons[i].update();}
                    });
                }
            }
        }
    }
}

// Auto Workshop upgrade, tab 3
function autoWorkshop() {
    if (autoCheck[6] != false && gamePage.workshopTab.visible != false) {
        var buttons = gamePage.workshopTab.buttons;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.metadata.unlocked && buttons[i].model.metadata.researched != true) {
                if ( ! buttons[i].model.enabled) buttons[i].update();
                if (buttons[i].model.enabled) {
                    buttons[i].controller.buyItem(buttons[i].model, {}, function(result) {
                        if (result) {buttons[i].update();}
                    });
                }
            }
        }
    }
}

// Auto buy relgion upgrades
function autoReligion() {
    if (autoCheck[13] != false && gamePage.religionTab.visible != false) {
        var buttons = gamePage.religionTab.rUpgradeButtons;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.visible && buttons[i].model.metadata.researched != true) {
                if ( ! buttons[i].model.enabled) buttons[i].update();
                if (buttons[i].model.enabled) {
                    buttons[i].controller.buyItem(buttons[i].model, {}, function(result) {
                        if (result) {buttons[i].update();}
                    });
                }
            }
        }
    }
}

// Auto buy unicorn upgrades
function autoUnicorn() {
    if (autoCheck[14] != false && gamePage.religionTab.visible != false) {
        /* About Unicorn Rifts
         * Each Tower causes a 0.05% chance for a rift per game-day
         * Each rift produces 500 Unicorns * (Unicorn Production Bonus)/10
         */
        var riftUnicorns = 500 * (1 + game.getEffect("unicornsRatioReligion") * 0.1);
        var upsprc = riftUnicorns / (100000/5); // unicorns per second per riftChance
        var ups = 5 * gamePage.getResourcePerTick('unicorns') / (1 + game.getEffect("unicornsRatioReligion"));

        // find which is the best value
        var buttons = gamePage.religionTab.zgUpgradeButtons;
        var bestButton = null;
        var bestValue = 0.0;
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].model.metadata.unlocked) {
                var ratio = buttons[i].model.metadata.effects.unicornsRatioReligion
                var rifts = buttons[i].model.metadata.effects.riftChance || 0
                var tearCost = buttons[i].model.prices.find(function(element){return element.name==='tears'})
                if (tearCost == null) continue;
                var value = (ratio * ups + rifts * upsprc) / tearCost.val;
                if (value > bestValue) {
                    bestButton = buttons[i];
                    bestValue = value;
                }
            }
        }

        // can we afford it?
        if (bestButton != null) {
            var cost = bestButton.model.prices.find(function(element){return element.name==='tears'}).val;
            var unicorns = gamePage.resPool.get('unicorns').value;
            var tears = gamePage.resPool.get('tears').value;
            var zigs = game.bld.get("ziggurat").on
            var available = tears + Math.floor(unicorns / 2500) * zigs
            if (available > cost) {
                if (tears < cost) {
                    var sacButton = gamePage.religionTab.sacrificeBtn;
                    // XXX: I don't like calling an internal function like _transform
                    // But it's the only way to request a specific number of Unicorn sacrifices, instead of spam-clicking...
                    sacButton.controller._transform(sacButton.model, Math.ceil((cost - tears) / zigs));
                }
                if ( ! bestButton.model.enabled) bestButton.update();
                bestButton.controller.buyItem(bestButton.model, {}, function(result) {
                    if (result) {bestButton.update();}
                });
            }
        }
    }
}

// Festival automatically
function autoParty() {
    if (autoCheck[7] != false && gamePage.science.get("drama").researched) {
        var catpower = gamePage.resPool.get('manpower').value;
        var culture = gamePage.resPool.get('culture').value;
        var parchment = gamePage.resPool.get('parchment').value;

        if (catpower > 1500 && culture > 5000 && parchment > 2500) {
            if (gamePage.prestige.getPerk("carnivals").researched && gamePage.calendar.festivalDays < 400*10) {
                gamePage.village.holdFestival(1);
            } else if (gamePage.calendar.festivalDays == 0) {
                gamePage.village.holdFestival(1);
            }
        }
    }
}

// Auto assign new kittens to selected job
function autoAssign() {
    if (autoCheck[8] != false && gamePage.village.getJob(autoChoice).unlocked) {
        gamePage.village.assignJob(gamePage.village.getJob(autoChoice), 1);
    }
}

// Try to manupulate time to force the cycle of our choosing
function autoCycle() {
    if (autoCheck[12] != false && game.calendar.cycle != cycleChoice) {
        // desired cycle: cycleChoice
        // current cycle: game.calendar.cycle
        // year in cycle: game.calendar.cycleYear
        var deltaCycle = (cycleChoice - game.calendar.cycle + game.calendar.cycles.length) % game.calendar.cycles.length;
        var deltaYears = deltaCycle*5 - game.calendar.cycleYear;
        var timeCrystals = gamePage.resPool.get('timeCrystal').value;

        // find and click the button
        if (timeCrystals != 0 && deltaYears != 0 && deltaYears <= timeCrystals) {
            for (var i = 0; i < gamePage.timeTab.children.length; i++) {
                if (gamePage.timeTab.children[i].name == "Chronoforge" && gamePage.timeTab.children[i].visible) {
                    var btn = gamePage.timeTab.children[i].children[0].children[0]; // no idea why there's two layers in the code
                    btn.controller.doShatterAmt(btn.model, deltaYears)
                }
            }
        }
    }
}

// Try to manupulate time to force the cycle of our choosing
function autoCycle() {
    if (autoCheck[12] != false && game.calendar.cycle != cycleChoice) {
        // desired cycle: cycleChoice
        // current cycle: game.calendar.cycle
        // year in cycle: game.calendar.cycleYear
        var deltaCycle = (cycleChoice - game.calendar.cycle + game.calendar.cycles.length) % game.calendar.cycles.length;
        var deltaYears = deltaCycle*5 - game.calendar.cycleYear;
        var timeCrystals = gamePage.resPool.get('timeCrystal').value;

        // find and click the button
        if (timeCrystals != 0 && deltaYears != 0 && deltaYears <= timeCrystals) {
            for (var i = 0; i < gamePage.timeTab.children.length; i++) {
                if (gamePage.timeTab.children[i].name == "Chronoforge" && gamePage.timeTab.children[i].visible) {
                    var btn = gamePage.timeTab.children[i].children[0].children[0]; // no idea why there's two layers in the code
                    btn.controller.doShatterAmt(btn.model, deltaYears)
                }
            }
        }
    }
}


// Control Energy Consumption
function energyControl() {
    if (autoCheck[9] != false) {
        proVar = gamePage.resPool.energyProd;
        conVar = gamePage.resPool.energyCons;

        if (bldAccelerator.val > bldAccelerator.on && proVar > (conVar + 3)) {
            bldAccelerator.on++;
            conVar++;
        } else if (bldCalciner.val > bldCalciner.on && proVar > (conVar + 3)) {
            bldCalciner.on++;
            conVar++;
        } else if (bldFactory.val > bldFactory.on && proVar > (conVar + 3)) {
            bldFactory.on++;
            conVar++;
        } else if (bldOilWell.val > bldOilWell.on && proVar > (conVar + 3)) {
            bldOilWell.on++;
            conVar++;
        } else if (bldBioLab.val > bldBioLab.on && proVar > (conVar + 3)) {
            bldBioLab.on++;
            conVar++;
        } else if (bldBioLab.on > 0 && proVar < conVar) {
            bldBioLab.on--;
            conVar--;
        } else if (bldOilWell.on > 0 && proVar < conVar) {
            bldOilWell.on--;
            conVar--;
        } else if (bldFactory.on > 0 && proVar < conVar) {
            bldFactory.on--;
            conVar--;
        } else if (bldCalciner.on > 0 && proVar < conVar) {
            bldCalciner.on--;
            conVar--;
        } else if (bldAccelerator.on > 0 && proVar < conVar) {
            bldAccelerator.on--;
            conVar--;
        }
    }
}

// Auto buys and sells bcoins optimally (not yet tested)
function autoBCoin() {
    if (autoCheck[10] != false && gamePage.science.get("antimatter").researched) {
        // When the price is > 1100 it loses 20-30% of its value
        // 880+ε is the highest it could be after an implosion
        if (gamePage.calendar.cryptoPrice < 881) {
            gamePage.diplomacy.buyEcoin();
            this.game.msg("Bought blackcoins");
        }
        if (gamePage.resPool.get('blackcoin').value > 0 && gamePage.calendar.cryptoPrice > (gamePage.calendar.cryptoPriceMax - 1)) {
            gamePage.diplomacy.sellEcoin();
            this.game.msg("Sold blackcoins");
        }
    }
}

function autoNip() {
    if (autoCheck[0] != false) {
        if (gamePage.bld.buildingsData[0].val < 20) {
            $(".btnContent:contains('Gather')").trigger("click");
        }
    }
}

// This function keeps track of the game's ticks and uses math to execute these functions at set times relative to the game.
clearInterval(runAllAutomation);
var runAllAutomation = setInterval(function() {
    autoNip();
    autoPraise();
    autoBuild();

    if (gamePage.timer.ticksTotal % 3 === 0) {
        autoObserve();
        autoCraft();
        autoHunt();
        autoAssign();
        energyControl();
    }

    if (gamePage.timer.ticksTotal % 10 === 0) {
        autoSpace();
    }

    if (gamePage.timer.ticksTotal % 25 === 0) {
        autoResearch();
        autoWorkshop();
        autoReligion();
        autoParty();
        autoTrade();
        autoEmbassy();
    }

    if (gamePage.timer.ticksTotal % 300 === 2) { // not ===  0 to avoid running at the same time as above
        autoCycle();
    } else if (gamePage.timer.ticksTotal % 300 === 151) {
        autoUnicorn();
    }
}, 200);
