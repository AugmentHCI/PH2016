/**
 * Created by robindecroon on 27/07/15.
 */
var x0 = 0,
    y0 = 0,
    camFieldWidth = 1920 - x0,
    camFieldHeight = 1080 - y0,
    wMul = window.innerWidth/camFieldWidth,
    hMul = window.innerHeight/camFieldHeight;

var width = window.innerWidth,
    height = window.innerHeight,
    τ = 2 * Math.PI,
    rWidth = 10,
    sizeBuffer = 120,
    rBuffer = 4,
    rectFromX = width/2,
    rectHeight = 18,
    rectWidth = 180,
    interactionLineWidth = 5,
    sideEffectStart = 200;

var auxTextFont = 14,
    textFont = 14,
    textStrokeWidth = "7px";

//var initialBodyBackgroundColor = "white",
//    dangerBackgroundColor ="black"// "#f3bbbb",
//    posologyColor = "steelblue",
//    posologyBackgroundColor = "#c7d9e8",
//    periodColor = "#fd8d3c",
//    periodDashColor = "#9e4401",
//    periodBackgroundColor = "#fedcc4",
//    episodeColor = "#7f7f7f",
//    episodeTextColor = "white",
//    interactionColor = "#d62728",
//    arrowColor = "#ceb9e1",
//    negativeArrowColor= "#9467bd",
//    lifetimeColor = "#69d094",
//    lifetimeBackgroundColor = "#c3ecd4";

var initialBodyBackgroundColor = "black",
    dangerBackgroundColor = "#f3bbbb",
    posologyColor = "#a9aa1e",
    posologyBackgroundColor = "#ebeb91",
    periodColor = " #ff7f0e",
    periodDashColor = "#9e4401",
    periodBackgroundColor = "#ffbe84",
    episodeColor = "#7f7f7f",
    episodeTextColor = "white",
    interactionColor = "#d62728",
    arrowColor = "#1f77b4",
    negativeArrowColor= "#9467bd",
    lifetimeColor = "6fbd22",
    lifetimeBackgroundColor = "#b7de90";

var pMedications,
    pEpisodes,
    pName,
    pGender,
    pAge,
    pWeight,
    pAllergies;

var medicationInfo = [],
    sideEffects = [];

var interactionsPresent = false;

var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Lifetime'];
var MONTH_NB_DAYS = [31,29,31,30,31,30,31,31,30,31,30,31,31];

var svg = d3.select("body")
    .append("svg")
    .attr("id","svg_layer")
    .attr("width", width)
    .attr("height", height);

var lowerLayer = svg
    .append("svg")
    .attr("id","svg_layer")
    .attr("width", width)
    .attr("height", height);

var upperLayer = svg
    .append("svg")
    .attr("id","svg_layer")
    .attr("width", width)
    .attr("height", height);

svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 4) /*must be smarter way to calculate shift*/
    .attr("refY", 2)
    .attr("markerWidth", 6)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .attr("fill", arrowColor)
    .append("path")
    .attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead

svg.append("defs").append("marker")
    .attr("id", "negativearrowhead")
    .attr("refX", 4) /*must be smarter way to calculate shift*/
    .attr("refY", 2)
    .attr("markerWidth", 6)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .attr("fill", negativeArrowColor)
    .append("path")
    .attr("d", "M 0,0 V 4 L6,2 Z"); //this is actual shape for arrowhead

var lineFunction = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("basis"); // basis

d3.json("achg/interaction.json", function(error, json) {
    medicationInfo = json;
});

function update() {
    //d3.json("http://localhost:4567/json", function(error, json) {
    //d3.json("testdata/locations.json", function(error, json) {
    d3.json("achg/aspirine-lysox-colludul.json", function(error, json) {
        if (error) return console.warn(error);
        if (json.errorType != "NONE") return console.warn(json.errorType);

        d3.selectAll(".arrow").remove();

        pName = json.name;
        pGender = json.gender;
        pAge = new Date().getFullYear() - json.birthdate.substring(0,4);
        pWeight = +json.weight;
        initSideEffects(json);
        initEpisodes(json);
        initMedications(json);
        initAllergies(json);

        drawAuxRectangles();

        interactionsPresent = false;
        visualizeInteractions();
        setBackgroundColor();

        visualizeEpisodes();
        visualizeSideEffects();
        visualizeAllergies();
        visualizePersonal();

        visualizeMedications();
        visualizeConnections();
    });
}

update();
//setInterval(update,500);


/*
 * Layout
 */

function setBackgroundColor() {
    if (interactionsPresent) {
        bodyBackgroundColor = dangerBackgroundColor;
        //d3.select("body").style("background", bodyBackgroundColor);
    } else {
        bodyBackgroundColor = initialBodyBackgroundColor;
    }
    d3.select("body").style("background", bodyBackgroundColor);
}

function drawAuxRectangles() {
    var auxData = [
        {
            type: "episodes",
            y: rectHeight - rBuffer,
            height: pEpisodes.length
        },
        {
            type: "side-effects",
            y: sideEffectStart + rectHeight - rBuffer,
            height: sideEffects.length
        },
        {
            type: "allergies",
            y: height - (pAllergies.length+6+2) * (rectHeight + rBuffer) - rBuffer,
            height: pAllergies.length
        },
        {
            type: "personal-data",
            y: height - 6 * (rectHeight + rBuffer) - rBuffer,
            height: 5
        }];

    lowerLayer.selectAll(".auxrect").data(auxData).enter().append("rect")
        .attr("class", "auxrect")
        .attr("x", rectFromX - rBuffer - rectWidth/2)
        .attr("y", function (d) {
            return d.y
        })
        .attr("width", rectWidth + 2*rBuffer)
        .attr("height", function (d) {
            return d.height * (rectHeight + rBuffer) + rBuffer * 3;
        })
        .style("fill", function (d) {
            switch (d.type) {
                case "episodes":
                    return arrowColor;
                case "side-effects":
                    return negativeArrowColor;
                default:
                    return episodeColor;
            };
        })
        .style("fill-opacity", 0.2)
        .style("stroke-opacity", 0.9)
        .style("stroke", episodeColor)
        .attr("id", function (d) {
            return d.type + "auxrect";
        });

    lowerLayer.selectAll(".auxtext").data(auxData).enter().append("text")
        .attr("class", "auxtext")
        .attr("dx", "1em")
        .attr("dy", "0.9em")
        .attr("x", rectFromX - rBuffer - rectWidth/2)
        .attr("y", function (d) {
            return d.y - rectHeight;
        })
        .attr("id", function (d) {
            return d.type + "auxtext";
        })
        .style("fill", function (d) {
            switch (d.type) {
                case "episodes":
                    return arrowColor;
                case "side-effects":
                    return negativeArrowColor;
                default:
                    return episodeColor;
            };
        })
        .style("font-size", textFont + 2)
        .text(function (d) {
            return d.type;
        });
}


function isMoreLikely(a, b) {
    if(a == "zeer vaak") {
        if(b == "zeer vaak") {
            return false;
        } else {
            return true;
        }
    } else if (a == "vaak") {
        if (b == "zeer vaak" || b == "vaak") {
            return false;
        } else {
            return true;
        }
    } else if (a == "soms") {
        if (b == "zeer vaak" || b == "vaak" || b == "soms") {
            return false;
        } else {
            return true;
        }
    } else if (a == "zelden") {
        if(b == "zelden") {
            return false;
        } else {
            return true;
        }
    }
}

/*
 * Init data
 */
function initSideEffects(json) {
    medicationInfo = medicationInfo.filter(function (info) {
        return json.objects.some(function (med) {
            return med.found && med.name === info.name
        })
    });

    var temp = [];
    medicationInfo.forEach(function (info) {
        temp = temp.concat(info.sideEffects);
    });
    // remove doubles
    var temp2 = [];
    temp.forEach(function (el) {
        if(temp2.some(function(inf) {return el.name == inf.name;})){
            temp2.forEach(function(el2) {
                if(el.name == el2.name) {

                    if (isMoreLikely(el.likelihood,el2.maxLikelihood)) {
                        el2.maxLikelihood = el.likelihood;
                    }
                }
            })
        } else {
            temp2.push({name: el.name, likelihood: el.likelihood, maxLikelihood: el.likelihood}); // als het nog niet voorkomt
        }
    });
    for (var i = 1; i <= temp2.length; i++) {
        sideEffects.push({
            name: temp2[i - 1].name,
            location: {
                x: rectFromX - rectWidth/2,
                y: (i) * (rectHeight + rBuffer) + sideEffectStart
            },
            likelihood: temp2[i - 1].likelihood,
            maxLikelihood: temp2[i - 1].maxLikelihood
        });
    }
}

function initMedications(json) {
    pMedications = json.objects.filter(function (d) {
        return d.found
    });
    pMedications.forEach(function(med) {
        med.rightUp.x = (med.rightUp.x - x0) * wMul;
        med.rightUp.y = (med.rightUp.y - y0) * hMul;
        med.rightDown.x = (med.rightDown.x - x0) * wMul;
        med.rightDown.y = (med.rightDown.y - y0) * hMul;
        med.leftUp.x = (med.leftUp.x - x0) * wMul;
        med.leftUp.y = (med.leftUp.y - y0) * hMul;
        med.leftDown.x = (med.leftDown.x - x0) * wMul;
        med.leftDown.y = (med.leftDown.y - y0) * hMul;

        med.circles = 0;
        med.center = locationToMedCenter(med);
    });
}

function initEpisodes(json) {
    // TODO preconditie dat sideeffects al zijn ingeladen
    pEpisodes = [];
    episodeAsSideEffects = [];
    // remove doubles
    var temp2 = [];
    json.episodes.forEach(function(el){
        var found = false;
        sideEffects.forEach(function(sideEffect) {
            if(sideEffect.name === el) {
                found = true;
            }
        });
        if(!found) temp2.push(el);
    });

    for (var i = 0; i < temp2.length; i++) {
        var name = temp2[i];
        var e = {name: name.replace("/", ""), location: {x: rectFromX - rectWidth/2, y: (i+1) * (rectHeight+rBuffer)}};
        pEpisodes.push(e);
    }
}

function initAllergies(json) {
    pAllergies = [];
    for (var i = 0; i < json.allergies.length; i++) {
        var name = json.allergies[i];
        var e = {name: name.replace("/", ""), location: {x: rectFromX - rectWidth/2, y: height - (6 + 2 + 1 + i) * (rectHeight+rBuffer) + rBuffer}};
        pAllergies.push(e);
    }
}

/*
 * Visualize  elements
 */

function visualizeConnections() {
    pMedications.forEach(function (m) {
        var info = getMedicationInfo(m.name);
        for (var i = 0; i < info.treats.length; i++) {
            pEpisodes.forEach(function (p) {
                if (p.name.indexOf(info.treats[i]) > -1) {
                    drawArrowFromTo(p, m, false, arrowColor);
                }
            });
        }
        for (var i = 0; i < info.sideEffects.length; i++) {
            sideEffects.forEach(function (p) {
                if (p.name.indexOf(info.sideEffects[i].name) > -1) {
                    drawArrowFromTo(m, p, false, hexColorWithSaturation(negativeArrowColor,info.sideEffects[i].likelihood));
                }
            });
        }
        for (var i = 0; i < info.sideEffects.length; i++) {
            episodeAsSideEffects.forEach(function (p) {
                if (p.name.indexOf(info.sideEffects[i].name) > -1) {
                    drawArrowFromTo(m, p, false, hexColorWithSaturation(negativeArrowColor,info.sideEffects[i].likelihood));
                }
            });
        }
        for (var i = 0; i < info.allergies.length; i++) {
            pAllergies.forEach(function (p) {
                if (p.name.indexOf(info.allergies[i]) > -1) {
                    drawArrowFromTo(m, p, false, interactionColor);
                    d3.select("#rect-"+ p.name).style("fill", interactionColor)
                }
            });
        }
        var theight = height - rectHeight;
        if (+info.minAge > +pAge) {
            interactionsPresent = true;
            drawArrowFromTo(m,{
                name: "age",
                location: {x: rectFromX - rectWidth/2, y: theight - (2 * rectHeight) + rectHeight/2}
            }, false, interactionColor);
            d3.select("#rect-age").style("fill", interactionColor)
        }
        if (+info.weight > +pWeight) {
            interactionsPresent = true;
            drawArrowFromTo(m,{
                name: "weight",
                location: {x: rectFromX - rectWidth/2, y: theight - (3 * rectHeight)+ rectHeight/2}
            }, false, interactionColor);
            d3.select("#rect-weight").style("fill", interactionColor)
        }
        if (!info.drivingAllowed) {
            interactionsPresent = true;
            drawArrowFromTo(m,{
                name: "driving",
                location: {x: rectFromX - rectWidth/2, y: theight - (4 * rectHeight)+ rectHeight/2}
            }, false, interactionColor);
            d3.select("#rect-driving").style("fill", interactionColor)
        }
        if (pGender === "FEMALE" && info.pregnant === false) {
            interactionsPresent = true;
            drawArrowFromTo(m,{
                name: "pregnant",
                location: {x: rectFromX - rectWidth/2, y: theight - (5 * rectHeight)+ rectHeight/2}
            }, false, interactionColor);
            d3.select("#rect-pregnant").style("fill", interactionColor)
        }
        if (pGender === "FEMALE" && info.breastfeeding === false) {
            interactionsPresent = true;
            drawArrowFromTo(m,{
                name: "breastfeeding",
                location: {x: rectFromX - rectWidth/2, y: theight - (6 * rectHeight)+ rectHeight/2}
            }, false, interactionColor);
            d3.select("#rect-breastfeeding").style("fill", interactionColor)
        }
    });
}





function createBar(bar, color) {
    bar.append("rect")
        .attr("id", function(d) { console.log(d); return "rect-" + d.name})
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .style("fill", color);
}

function createTextInBar(bar, textFunction) {
    bar.append("text")
        .attr("dx", "1em")
        .attr("dy", "1em")
        .style("fill", episodeTextColor)
        .style("font-size", textFont)
        .text(textFunction);
}

function visualizeEpisodes() {
    var bar = upperLayer.selectAll(".episodes")
        .data(pEpisodes)
        .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("class","episodes")
        .attr("transform", function(d, i) {
            return "translate(" + d.location.x + ", " + d.location.y + ")";
        });

    createBar(bar, arrowColor);
    createTextInBar(bar, function(d) {
        return d.name;
    });
}

function visualizeAllergies() {
    var bar = upperLayer.selectAll(".allergies")
        .data(pAllergies)
        .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("class","episodes")
        .attr("transform", function(d, i) {
            return "translate(" + d.location.x + ", " + d.location.y + ")";
        });

    createBar(bar, episodeColor);
    createTextInBar(bar, function(d) {
        return d.name;
    });
}

function visualizeSideEffects() {
    var bar = upperLayer.selectAll(".sideeffect")
        .data(sideEffects)
        .enter().append("g")
        .attr("class", "sideeffect")
        .attr("transform", function (d, i) {
            return "translate(" + d.location.x + ", " + d.location.y + ")";
        });

    createBar(bar, function(d) {return hexColorWithSaturation(negativeArrowColor, d.maxLikelihood)});
    createTextInBar(bar, function (d, i) {
        return d.name;
    });
}

function visualizePersonal() {
    var theight = height - rectHeight;
    var bar = upperLayer.selectAll(".personal")
        .data(function () {
            if (pGender === "MALE") {
                return [{name: "age", value: pAge}, {name: "weight", value: pWeight}, {name: "driving", value: "driving"}];
            } else {
                return [{name: "age", value: pAge}, {name: "weight", value: pWeight}, {name: "driving", value: "driving"} , {name: "pregnant", value: "pregnant"}, {name: "breastfeeding", value: "breastfeeding"}]
            }
        })
        .enter().append("g")
        .attr("class", "personal")
        .attr("transform", function (d, i) {
            return "translate(" + (rectFromX - rectWidth/2) + ", " + (theight - (i+1)*(rectHeight + rBuffer)) + ")";
        });

    var textFunction = function (d, i) {
        switch (i) {
            case 0:
                return "age: " + d.value + " years";
            case 1:
                return "weight: " + d.value + " kg";
            default:
                return d.name;
        }
    };

    createBar(bar, episodeColor);
    createTextInBar(bar,textFunction);
}

function visualizeInteractions() {
    // find interactions
    for (var i = 0; i < pMedications.length; i++) {
        var m = getMedicationInfo(pMedications[i].name);
        for (var j = 0; j < m.interactions.length; j++) {
            for (var k = 0; k < pMedications.length; k++) {
                if (m.interactions[j] === pMedications[k].name) {
                    interactionsPresent = true;
                    drawArrowFromTo(pMedications[i], pMedications[k], false, interactionColor);
                }
            }
        }
    }
}



function drawArrowFromTo(object0, object1, arrow, color) {
    if (object0.center == undefined && object1.center !== undefined) {
        var temp =  object0;
        object0 = object1;
        object1 = temp;
    }
    var startPoint  = object0.center;
    if(startPoint == undefined) {
        startPoint = {x: object0.location.x + rectWidth, y: object0.location.y + rectHeight/2}
    }
    var endPoint    = object1.center;
    if(endPoint == undefined) {
        endPoint = {x: object1.location.x + rectWidth, y: object1.location.y + rectHeight/2}
    }

    var lineData = [];
    if(startPoint.x > endPoint.x) {
        lineData = [{x: startPoint.x, y: startPoint.y}, {x: endPoint.x, y: endPoint.y}];
    } else {
        lineData = [{x: endPoint.x - rectWidth, y: endPoint.y}, {x: startPoint.x , y: startPoint.y}];
    }


    var extraPoints = interceptOnCircle(startPoint,endPoint, object0, object1);
    extraPoints.forEach(function(p) {
        var temp = lineData.pop();
        lineData = lineData.concat(p);
        lineData.push(temp);
    });

    lowerLayer.append("path")
        .attr("class", "arrow")
        .attr("d", lineFunction(lineData))
        .attr("stroke", color)
        .attr("stroke-width", interactionLineWidth)
        .attr("fill", "none");
}


function interceptOnCircle(p1,p2, o1,o2){
    var V = SAT.Vector;
    var C = SAT.Circle;
    var P = SAT.Polygon;

    var points = [];
    var polygon = new P(new V(0, 0), [new V(p1.x, p1.y), new V(p2.x, p2.y)]);

    pMedications.forEach(function(med) {
        var c = med.center;
        var r = (getInnerSize(med)/2) + (5*(rWidth + rBuffer));
        var circle = new C(new V(c.x, c.y), (r-1)); // not the two original circles
        var response = new SAT.Response();
        var collided = SAT.testPolygonCircle(polygon, circle, response);

        if(collided && !(med == o1 || med == o2)) {
            points.push({x: c.x - (r/response.overlap)*response.overlapV.x, y: c.y - (r/response.overlap)*response.overlapV.y});
        }
    });

    // Test rectangle in the middle part
    var boxes = new P(new V(0, 0), [new V(rectFromX, (rectHeight+2*rBuffer) * (pEpisodes.length + sideEffects.length)), new V(rectFromX, 0)]);
    var response = new SAT.Response();
    var collided = SAT.testPolygonPolygon(boxes, polygon, response);
    if (collided && o1.center && o2.center) { // TODO vuile hack
        points.push({x: width/2, y: 1.2 * (rectHeight+2*rBuffer) * (pEpisodes.length + sideEffects.length)});
    }

    // depends on the direction
    points.sort(function(a,b) {
        if(p1.x < p2.x) {
            return a.x - b.x; // left to right
        } else {
            return b.x - a.x;
        }
    });
    return points;
}


function visualizeMedications() {
    // DATA JOIN
    var medCircleGroups = upperLayer.selectAll(".circle_group")
        .data(pMedications,function(d,i) {
            return d.name
        });

    // UPDATE
    medCircleGroups
        .attr("transform", function(d) { return "translate(" + d.center.x + "," + d.center.y + ")";});

    // ENTER
    medCircleGroups
        .enter()
        .append("g")
        .attr("id", function(d) {
            return d.name
        })
        .attr("class", "circle_group")
        .attr("transform", function(d) { return "translate(" + d.center.x + "," + d.center.y + ")";})
        .style("fill", episodeTextColor);


    // INNER CIRCLES
    pMedications.forEach(function(medBox) {

        var medInfo = getMedicationInfo(medBox.name);
        if (medInfo === undefined) return; // no information available

        d3.select("#" + medBox.name)
            .selectAll(".med_arc")
            .remove();

        d3.select("#" + medBox.name)
            .selectAll(".auxtext")
            .remove();

        if(medInfo === undefined) {
            createCircle(
                medBox,
                innerRadius,
                "grey"
            );
        }

        initPeriods(medBox, medInfo);
        initPosology(medBox, medInfo.posology.dailyAmount);
    });

    medCircleGroups.exit().remove();

    /**
     * Init the posology background circle and arcs
     * @param medBox
     * @param medInfo
     */
    function initPosology(medBox, dailyAmount) {
        var innerRadius = getInnerSize(medBox)/2;

        createCircle(
            medBox,
            innerRadius,
            posologyBackgroundColor
        );

        d3.select("#" + medBox.name)
            .append("text")
            .attr("class", "auxtext")
            .attr("x", 0)
            .attr("y", -getInnerSize(medBox)/2.1)
            .attr("dy", ".7em")
            .attr("text-anchor", "middle")
            .style("fill", episodeTextColor)
            .style("font-size", auxTextFont)
            .style("stroke", bodyBackgroundColor)
            .style("stroke-width", textStrokeWidth)
            .style("stroke-linejoin", "round")
            .style("paint-order", "stroke")
            .text("Midnight");
        d3.select("#" + medBox.name)
            .append("text")
            .attr("class", "auxtext")
            .attr("x", 0)
            .attr("y", getInnerSize(medBox)/2.1)
            .attr("dy", "-.35em")
            .attr("text-anchor", "middle")
            .style("fill", episodeTextColor)
            .style("font-size", auxTextFont)
            .style("stroke", bodyBackgroundColor)
            .style("stroke-width", textStrokeWidth)
            .style("stroke-linejoin", "round")
            .style("paint-order", "stroke")
            .text("Noon");
        d3.select("#" + medBox.name)
            .append("text")
            .attr("class", "auxtext")
            .attr("x", getInnerSize(medBox)/2.2)
            .attr("y", 0)
            .attr("dx", "-.7em")
            .attr("text-anchor", "middle")
            .style("fill", episodeTextColor)
            .style("font-size", auxTextFont)
            .style("stroke", bodyBackgroundColor)
            .style("stroke-width", textStrokeWidth)
            .style("stroke-linejoin", "round")
            .style("paint-order", "stroke")
            .text("6 AM");
        d3.select("#" + medBox.name)
            .append("text")
            .attr("class", "auxtext")
            .attr("x", -getInnerSize(medBox)/2.2)
            .attr("y", 0)
            .attr("dx", ".7em")
            .attr("text-anchor", "middle")
            .style("fill", episodeTextColor)
            .style("font-size", auxTextFont)
            .style("stroke", bodyBackgroundColor)
            .style("stroke-width", textStrokeWidth)
            .style("stroke-linejoin", "round")
            .style("paint-order", "stroke")
            .text("6 PM");

        switch (dailyAmount) {
            case 0:
                break;
            case 1:
                createPosArc(
                    medBox,
                    innerRadius,
                    (7 / 24) * τ,
                    (9 / 24) * τ,
                    posologyColor
                );
                break;
            case 2:
                createPosArc(
                    medBox,
                    innerRadius,
                    (6 / 24) * τ,
                    (11 / 24) * τ,
                    posologyColor
                );
                createPosArc(
                    medBox,
                    innerRadius,
                    (16 / 24) * τ,
                    (20 / 24) * τ,
                    posologyColor
                );
                break;
            case 3:
                createPosArc(
                    medBox,
                    innerRadius,
                    (7 / 24) * τ,
                    (9 / 24) * τ,
                    posologyColor
                );
                createPosArc(
                    medBox,
                    innerRadius,
                    (11 / 24) * τ,
                    (13 / 24) * τ,
                    posologyColor
                );
                createPosArc(
                    medBox,
                    innerRadius,
                    (17 / 24) * τ,
                    (20 / 24) * τ,
                    posologyColor
                );
                break;
            default:
                var angle = τ / dailyAmount;
                for (var a = 0; a < dailyAmount; a++) {
                    createPosArc(
                        medBox,
                        innerRadius,
                        (a * angle) - 0.1,
                        (a * angle) + 0.1,
                        posologyColor
                    );
                }
        }
        for(var i = 0; i < 24; i++) {
            createPosArc(medBox,
                innerRadius,
                ((i-0.01) / 24) * τ,
                ((i+0.01) / 24) * τ,
                posologyColor);
        }

    }

    function daysInMonth(day) {
        return new Date(day.toString("yyyy"), +(day.toString("M")), 0).getDate()
    }


    /**
     * init all posology arc on the selected circle
     */
    function initPeriods(medBox, medInfo) {
        var medSvg = d3.select("#" + medBox.name);

        var startDate = Date.parse(medInfo.startDate);
        var endDate = Date.parse(medInfo.endDate);
        var startMonthNumber = +(startDate.toString('M'));
        var endMonthNumber = +(endDate.toString('M'));
        var startWeekDay = medInfo.weekday !== undefined && eval("startDate.next()." + medInfo.weekday + "()");
        var nbMonths = endMonthNumber - startMonthNumber + 1;
        if (nbMonths < 0) {
            nbMonths = 12 - startMonthNumber + endMonthNumber + 1;
        }
        var lifetime = +endDate.toString("yyyy") < +startDate.toString("yyyy");
        if(lifetime) {
            nbMonths = 1;
            startDate = Date.parse("2015-01-01");
            endDate = Date.parse("2015-01-31");
            startMonthNumber = 1;
        }

        d3.select("#" + medBox.name + "-arcpath" + i).remove();

        for (var i = 0; i < nbMonths; i++) {
            var innerRadius = getInnerSize(medBox) / 2 + ((i + 1) * (rWidth + rBuffer));
            var monthIndex = lifetime ? 12 : (startMonthNumber + i - 1) % 12;
            var path = d3.select("#" + medBox.name)
                .append("path")
                .attr("id", medBox.name + "-arcpath" + i)
                .attr("class", "period_arc")
                .style("fill", "none")
                .attr("d", innerArc(innerRadius, -0.1 * Math.PI, 0)(medBox));

            medSvg.append("text")
                .attr("dy", rWidth / 2 + 4)
                .append("textPath") //append a textPath to the text element
                .attr("xlink:href", "#" + medBox.name + "-arcpath" + i) //place the ID of the path here
                .attr("text-anchor", "end")
                .attr("startOffset", "42%")
                .attr("fill", episodeTextColor)
                .text(MONTH_NAMES[monthIndex]);

            var daysInMonth = MONTH_NB_DAYS[monthIndex];
            var endAngle = daysInMonth / 31 * 1.9 * Math.PI;

            createPosArc(medBox, innerRadius, 0, endAngle, lifetime ? lifetimeBackgroundColor : periodBackgroundColor);

            if (!startWeekDay && i !== nbMonths - 1) {
                if (i === 0) {
                    createPosArc(medBox, innerRadius, (startDate.getDate() / daysInMonth) * endAngle, endAngle, lifetime ? lifetimeColor : periodColor);
                } else {
                    createPosArc(medBox, innerRadius, 0, endAngle, lifetime ? lifetimeColor : periodColor);
                }
            } else {
                if (!startWeekDay) {
                    if (i === 0) {
                        createPosArc(medBox, innerRadius, ((startDate.getDate()-1) / daysInMonth) * endAngle, (endDate.getDate() / daysInMonth) * endAngle, lifetime ? lifetimeColor : periodColor);
                    } else {
                        createPosArc(medBox, innerRadius, 0, (endDate.getDate() / daysInMonth) * endAngle, lifetime ? lifetimeColor : periodColor);
                    }
                } else {
                    // TODO juiste vakjes kleuren
                    createPosArc(medBox, innerRadius, 0, endAngle, lifetime ? lifetimeBackgroundColor : periodBackgroundColor);
                    for (var k = 0; k < 5; k++) {
                        if (startWeekDay.between(startDate, endDate) && +(startWeekDay.toString('M')) === (startMonthNumber + i)) {
                            createPosArc(
                                medBox,
                                innerRadius,
                                ((startWeekDay.getDate() - 1) / daysInMonth) * endAngle,
                                ((startWeekDay.getDate()) / daysInMonth) * endAngle,
                                lifetime ? lifetimeColor : periodColor
                            );
                            startWeekDay.addWeeks(1);
                        }
                    }
                }
            }
            for (var j = 0; j < daysInMonth && !lifetime; j++) {
                createPosArc(medBox,
                    innerRadius,
                    ((j - 0.01) / daysInMonth) * endAngle,
                    ((j + 0.01) / daysInMonth) * endAngle,
                    periodDashColor);

                if (i == nbMonths - 1) {
                    medSvg
                        .append("text")
                        .attr("class", "auxtext")
                        .attr("x", (getInnerSize(medBox) / 2 + (i + 2.5) * (rWidth + rBuffer)) * -Math.cos((((j + 0.5) / daysInMonth) * endAngle) + Math.PI / 2))
                        .attr("y", (getInnerSize(medBox) / 2 + (i + 2.5) * (rWidth + rBuffer)) * -Math.sin((((j + 0.5) / daysInMonth) * endAngle) + Math.PI / 2))
                        .attr("text-anchor", "middle")
                        .style("fill", periodColor)
                        .style("font-size", auxTextFont)
                        .style("text-anchor", "middle")
                        .attr("dy", ".3em")
                        .style("stroke", bodyBackgroundColor)
                        .style("stroke-width", textStrokeWidth)
                        .style("stroke-linejoin", "round")
                        .style("paint-order", "stroke")
                        .text(j + 1);
                }
            }
        }

        // TODO data in orde maken en dan tutorial volgen --> animaties voor later
        //var periodData = [];
        //for(var i = 0; i < nbMonths; i++) {
        //    periodData.push(
        //        {
        //            month: MONTH_NAMES[startMonthNumber + i - 1],
        //            days: daysInMonth(startDate)
        //        }
        //    )
        //}



    }

    /**
     * Create a circle for the given medication box with radius and color
     */
    function createCircle(medBox,radius, color) {
        medBox.circles++;
        createPosArc(medBox,radius,0,τ,color);
    }

    /**
     * Create arc for the given medication box with radius, color start and end angle
     */
    function createPosArc(medBox,radius,startAngle,endAngle,color) {
        d3.select("#" + medBox.name)
            .append("path")
            .attr("class", "med_arc")
            .style("fill", color)
            .attr("d", innerArc(radius, startAngle,endAngle)(medBox));
    }

    // Arc auxiliary functin
    function innerArc(innerRadius, startAngle, endAngle) {
        return d3.svg.arc()
            .startAngle(startAngle)
            .endAngle(endAngle)
            .innerRadius(innerRadius)
            .outerRadius(innerRadius + rWidth)
    }

    // Creates a tween on the specified transition's "d" attribute, transitioning
    // any selected arcs from their current angle to the specified new angle.
    function arcTween(transition, newAngle) {
        transition.attrTween("d", function(d) {
            var interpolate = d3.interpolate(d.endAngle, newAngle);
            return function(t) {
                d.endAngle = interpolate(t);
                return innerArc(d);
            };
        });
    }
}

/**
 * get width of medication box
 */
function getMedWidth(o) {
    return d3.max([+o.rightUp.x - +o.leftUp.x,+o.rightDown.x - +o.leftDown.x]);
}

/**
 * get height of medication box
 */
function getMedHeight(o) {
    return d3.max([+o.rightDown.y - +o.rightUp.y,+o.leftDown.y - +o.leftUp.y]);
}

/**
 * get maximum dimension of medication box
 */
function getInnerSize(medBox) {
    return d3.max([getMedHeight(medBox), getMedWidth(medBox)]) + sizeBuffer;
}

/**
 * Get location to medication box center
 */
function locationToMedCenter(medBox) {
    var cx = +medBox.leftUp.x + getMedWidth(medBox) / 2;
    var cy = +medBox.leftUp.y + getMedHeight(medBox) / 2;
    return {x: cx, y:cy};
}

/**
 * Makes it easier to access medication info
 */
function getMedicationInfo(medicationName) {
    return medicationInfo.filter(function(m) {return m.name === medicationName})[0];
}


function hexColorWithSaturation(hex, percent) {
    if (!/^#([0-9a-f]{6})$/i.test(hex)) {
        throw('Unexpected color format');
    }

    var realPercent;
    switch (percent) {
        case "zeer vaak":
            realPercent = 100;
            break;
        case "vaak":
            realPercent = 75;
            break;
        case "soms":
            realPercent = 45;
            break;
        case "zelden":
            realPercent = 20;
            break;
        default :
            console.log(percent);
    }
    percent = realPercent;

    var r       = parseInt(hex.substr(1,2), 16),
        g       = parseInt(hex.substr(3,2), 16),
        b       = parseInt(hex.substr(5,2), 16),
        sorted  = [r, g, b].sort(function(a, b){return a-b;}),
        min     = sorted[0],
        med     = sorted[1],
        max     = sorted[2];

    if (min == max) {
        // has no color
        return hex;
    }

    var max2    = max,
        rel     = (max-med)/(med-min),
        min2    = max/100 * (100-percent),
        med2    = isFinite(rel) ? (rel * min2 + max2) / (rel + 1) : min2,
        int2hex = function(int) { return ('0' + int.toString(16)).substr(-2); },
        rgb2hex = function(rgb) { return '#' + int2hex(rgb[0]) + int2hex(rgb[1]) + int2hex(rgb[2]); },
        hex2;

    min2 = Math.round(min2);
    med2 = Math.round(med2);

    if (r == min) {
        hex2 = rgb2hex( g==med ? [min2, med2, max2] : [min2, max2, med2] );
    }
    else if (r == med) {
        hex2 = rgb2hex( g == max ? [med2, max2, min2] : [med2, min2, max2] );
    }
    else {
        hex2 = rgb2hex( g == min ? [max2, min2, med2] : [max2, med2, min2] );
    }

    return hex2;
}