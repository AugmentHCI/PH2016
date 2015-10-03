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
    sizeBuffer = 20,
    rBuffer = 4,
    rectFromX = 10,
    rectHeight = 18,
    rectWidth = 180,
    interactionLineWidth = 5,
    sideEffectStart = 300;

var auxTextFont = 14,
    textFont = 14,
    textStrokeWidth = "7px";

var initialBodyBackgroundColor = "black",
    dangerBackgroundColor = "black",// "#f3bbbb",
    posologyColor = "steelblue",
    posologyBackgroundColor = "#c7d9e8",
    periodColor = "#fd8d3c",
    periodDashColor = "#9e4401",
    periodBackgroundColor = "#fedcc4",
    episodeColor = "#7f7f7f",
    episodeTextColor = "white",
    interactionColor = "#d62728",
    arrowColor = "#ceb9e1",
    negativeArrowColor= "#9467bd";

var pMedications,
    pEpisodes,
    pName,
    pGender,
    pAge,
    pWeight;

var medicationInfo = [],
    sideEffects = [];

var interactionsPresent = false;

var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var daysInMonths = [31,29,31,30,31,30,31,31,30,31,30,31];

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
    .interpolate("basis");

d3.json("testdata/medicationInfo.json", function(error, json) {
    medicationInfo = json;
    var temp = [];
    medicationInfo.forEach(function (info) {
        temp = temp.concat(info.sideEffects);
    });
    // remove doubles
    var temp2 = [];
    temp.forEach(function(el){
        if(temp2.indexOf(el) === -1) temp2.push(el);
    });
    for(var i = 1; i <= temp2.length; i++) {
        var j = i + temp2.length;
        sideEffects.push({
            name: temp2[i-1],
            location: {
                x: rectFromX,
                y: (i) * (rectHeight + rBuffer) + sideEffectStart
        }});
    }
});

function update() {
    //d3.json("http://localhost:4567/json", function(error, json) {
    //d3.json("testdata/locations.json", function(error, json) {
    d3.json("testdata/motilium-aspirine-lysox-colludul-acetylcysteine.json", function(error, json) {
        if (error) return console.warn(error);
        if (json.errorType != "NONE") return console.warn(json.errorType);

        d3.selectAll(".arrow").remove();

        pName = json.name;
        pGender = json.gender;
        pAge = new Date().getFullYear() - json.birthdate.substring(0,4);
        pWeight = +json.weight;

        initEpisodes(json);
        initMedications(json);
        initAuxRectangles();

        interactionsPresent = false;
        visualizeInteractions();
        setBackgroundColor();

        visualizeEpisodes();
        visualizeSideEffects();
        visualizePersonal();

        visualizeMedications();
        visualizeConnections();
    });
}

update();
setInterval(update,500);

function setBackgroundColor() {
    if (interactionsPresent) {
        bodyBackgroundColor = dangerBackgroundColor;
        //d3.select("body").style("background", bodyBackgroundColor);
    } else {
        bodyBackgroundColor = initialBodyBackgroundColor;
    }
    d3.select("body").style("background", bodyBackgroundColor);
}

function visualizeConnections() {
    pMedications.forEach(function (m) {
        var info = getMedicationInfo(m.name);
        for (var i = 0; i < info.treats.length; i++) {
            pEpisodes.forEach(function (p) {
                if (p.name.indexOf(info.treats[i]) > -1) {
                    drawArrowFromTo(p, m, true, arrowColor);
                }
            });
        }
        for (var i = 0; i < info.sideEffects.length; i++) {
            sideEffects.forEach(function (p) {
                if (p.name.indexOf(info.sideEffects[i]) > -1) {
                    drawArrowFromTo(m, p, true, negativeArrowColor);
                }
            });
        }
        for (var i = 0; i < info.sideEffects.length; i++) {
            episodeAsSideEffects.forEach(function (p) {
                if (p.name.indexOf(info.sideEffects[i]) > -1) {
                    drawArrowFromTo(m, p, true, negativeArrowColor);
                }
            });
        }
        var theight = height - rectHeight;
        if (+info.minAge > +pAge) {
            interactionsPresent = true;
            drawArrowFromTo({
                name: "age",
                location: {x: rectFromX, y: theight - (2 * rectHeight) + rectHeight/2}
            }, m, false, interactionColor);
        }
        if (+info.weight > +pWeight) {
            interactionsPresent = true;
            drawArrowFromTo({
                name: "weight",
                location: {x: rectFromX, y: theight - (3 * rectHeight)+ rectHeight/2}
            }, m, false, interactionColor);
        }
        if (!info.drivingAllowed) {
            interactionsPresent = true;
            drawArrowFromTo({
                name: "driving",
                location: {x: rectFromX, y: theight - (4 * rectHeight)+ rectHeight/2}
            }, m, false, interactionColor);
        }
        if (pGender === "FEMALE" && info.pregnant === false) {
            interactionsPresent = true;
            drawArrowFromTo({
                name: "pregnant",
                location: {x: rectFromX, y: theight - (5 * rectHeight)+ rectHeight/2}
            }, m, false, interactionColor);
        }
        if (pGender === "FEMALE" && info.breastfeeding === false) {
            interactionsPresent = true;
            drawArrowFromTo({
                name: "breastfeeding",
                location: {x: rectFromX, y: theight - (6 * rectHeight)+ rectHeight/2}
            }, m, false, interactionColor);
        }
    });
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

function initAuxRectangles() {
    var auxData = [{type: "episodes", y: rectHeight - rBuffer, height: pEpisodes.length}, {
        type: "side-effects",
        y: sideEffectStart + rectHeight - rBuffer,
        height: sideEffects.length
    }, {type: "personal-data", y: height - 6 * (rectHeight + rBuffer) - rBuffer, height: 5}];

    lowerLayer.selectAll(".auxrect").data(auxData).enter().append("rect")
        .attr("class", "auxrect")
        .attr("x", rectFromX - rectFromX / 2)
        .attr("y", function (d) {
            return d.y
        })
        .attr("width", rectWidth + rectFromX)
        .attr("height", function (d) {
            return d.height * (rectHeight + rBuffer) + rBuffer * 3;
        })
        .style("fill", "white")
        .style("fill-opacity", 0.2)
        .style("stroke-opacity", 0.9)
        .style("stroke", episodeTextColor)
        .attr("id", function (d) {
            return d.type + "auxrect";
        });

    lowerLayer.selectAll(".auxtext").data(auxData).enter().append("text")
        .attr("class", "auxtext")
        .attr("dx", "1em")
        .attr("dy", "0.9em")
        .attr("x", rectFromX - rectFromX / 2)
        .attr("y", function (d) {
            return d.y - rectHeight;
        })
        .attr("id", function (d) {
            return d.type + "auxtext";
        })
        .style("fill", episodeTextColor)
        .style("font-size", textFont + 2)
        .text(function (d) {
            return d.type;
        });
}

function createBar(bar) {
    bar.append("rect")
        .attr("class", "personalRect")
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .style("fill", episodeColor);
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

    createBar(bar);
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

    createBar(bar);
    createTextInBar(bar, function (d, i) {
        return d.name;
    });
}

function visualizePersonal() {
    var theight = height - rectHeight;
    var bar = upperLayer.selectAll(".personal")
        .data(function () {
            if (pGender === "MALE") {
                return [pAge, pWeight, "driving"];
            } else {
                return [pAge, pWeight, "driving", "pregnant", "breastfeeding"]
            }
        })
        .enter().append("g")
        .attr("class", "personal")
        .attr("transform", function (d, i) {
            return "translate(" + rectFromX + ", " + (theight - (i+1)*(rectHeight + rBuffer)) + ")";
        });

    var textFunction = function (d, i) {
        switch (i) {
            case 0:
                return "age: " + d + " years";
            case 1:
                return "weight: " + d + " kg";
            default:
                return d;
        }
    };

    createBar(bar);
    createTextInBar(bar,textFunction);
}

var interactions = [];
function visualizeInteractions() {
    // find interactions
    for (var i = 0; i < pMedications.length; i++) {
        var m = getMedicationInfo(pMedications[i].name);
        for (var j = 0; j < m.interactions.length; j++) {
            for (var k = 0; k < pMedications.length; k++) {
                if (m.interactions[j] === pMedications[k].name) {
                    interactionsPresent = true;
                    //interactions.push({from: , to: })
                    drawArrowFromTo(pMedications[i], pMedications[k], false, interactionColor);
                }
            }
        }
    }
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
        var e = {name: name.replace("/", ""), location: {x: rectFromX, y: (i+1) * (rectHeight+rBuffer)}};
        pEpisodes.push(e);
    }
}


function drawArrowFromTo(object0, object1, arrow, color) {
    var startPoint  = object0.center;
    if(startPoint == undefined) {
        startPoint = {x: object0.location.x + rectWidth, y: object0.location.y + rectHeight/2}
    }
    var endPoint    = object1.center;
    if(endPoint == undefined) {
        endPoint = {x: object1.location.x + rectWidth, y: object1.location.y + rectHeight/2}
    }

    var lineData = [{x: startPoint.x, y: startPoint.y}, {x: endPoint.x, y: endPoint.y}];

    var extraPoints = interceptOnCircle(startPoint,endPoint, object0, object1);
    extraPoints.forEach(function(p) {
        var temp = lineData.pop();
        lineData = lineData.concat(p);
        lineData.push(temp);
    });

    var lineGraph = lowerLayer.append("path")
        .attr("class", "arrow")
        .attr("d", lineFunction(lineData))
        .attr("stroke", color)
        .attr("stroke-width", interactionLineWidth)
        .attr("fill", "none")
        .attr("marker-end", function() {
            if(arrow && startPoint.x > endPoint.x) {
                return "url(#negativearrowhead)";
            } else if (arrow) {
                return "url(#arrowhead)";
            }
        });
}


function interceptOnCircle(p1,p2, o1,o2){
    var V = SAT.Vector;
    var C = SAT.Circle;
    var P = SAT.Polygon;

    var points = [];
    pMedications.forEach(function(med) {
        var c = med.center;
        var r = (getInnerSize(med)/2) + (15 * (rWidth + rBuffer));
        var circle = new C(new V(c.x, c.y), (r-1)); // not the two original circles
        var polygon = new P(new V(0,0), [new V(p1.x,p1.y),new V(p2.x,p2.y)]);
        var response = new SAT.Response();
        var collided = SAT.testPolygonCircle(polygon, circle, response);

        if(collided && !(med == o1 || med == o2)) {
            points.push({x: c.x - (r/response.overlap)*response.overlapV.x, y: c.y - (r/response.overlap)*response.overlapV.y});
        }
    });

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
            .style("fill", posologyColor)
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
            .style("fill", posologyColor)
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
            .style("fill", posologyColor)
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
            .style("fill", posologyColor)
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
        if(nbMonths < 0) {
            nbMonths = 12 - startMonthNumber + endMonthNumber + 1;
        }

        console.log(nbMonths);
        for(var i = 0; i < nbMonths; i++) {
            var monthIndex = (startMonthNumber + i - 1)%12;
            var innerRadius = getInnerSize(medBox)/2 + ((i + 1) * (rWidth + rBuffer));
            var path = d3.select("#" + medBox.name)
                .append("path")
                .attr("id", medBox.name + "-arcpath" + i)
                .attr("class", "period_arc")
                .style("fill", "none")
                .attr("d", innerArc(innerRadius, -0.1*Math.PI,0)(medBox));

            medSvg.append("text")
                .attr("dy",rWidth/2 + 4)
                .append("textPath") //append a textPath to the text element
                .attr("xlink:href", "#" + medBox.name + "-arcpath"+i) //place the ID of the path here
                .attr("text-anchor", "end")
                .attr("startOffset", "42%")
                .attr("fill", episodeTextColor)
                .text(months[monthIndex]);

            var daysInMonth = daysInMonths[monthIndex];
            var endAngle = daysInMonth/31 * 1.9*Math.PI;
            createPosArc(medBox,innerRadius, 0, endAngle,periodBackgroundColor);

            if(!startWeekDay && i !== nbMonths-1) {
                if(i === 0) {
                    createPosArc(medBox,innerRadius, (startDate.getDate() / daysInMonth) * endAngle, endAngle,periodColor);
                } else {
                    createPosArc(medBox,innerRadius, 0, endAngle,periodColor);
                }
            } else {
                if(!startWeekDay) {
                    if(i === 0) {
                        createPosArc(medBox,innerRadius, (startDate.getDate() / daysInMonth) * endAngle, (endDate.getDate() / daysInMonth) * endAngle, periodColor);
                    } else {
                        createPosArc(medBox,innerRadius, 0, (endDate.getDate() / daysInMonth) * endAngle, periodColor);
                    }
                } else {
                   // TODO juiste vakjes kleuren
                    createPosArc(medBox,innerRadius, 0, endAngle,periodBackgroundColor);
                    for (var k = 0; k < 5; k++) {
                        if (startWeekDay.between(startDate,endDate) && +(startWeekDay.toString('M')) === (startMonthNumber+i)) {
                            createPosArc(
                                medBox,
                                innerRadius,
                                ((startWeekDay.getDate() - 1) / daysInMonth) * endAngle,
                                ((startWeekDay.getDate()) / daysInMonth) * endAngle,
                                periodColor
                            );
                            startWeekDay.addWeeks(1);
                        }
                    }
                }
            }
            for (var j = 0; j < daysInMonth; j++) {
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
        //            month: months[startMonthNumber + i - 1],
        //            days: daysInMonth(startDate)
        //        }
        //    )
        //}


        //createCircle(medBox, getInnerSize(medBox)/2 + rWidth + rBuffer, periodBackgroundColor);
        //
        //var startDate = Date.parse(medInfo.startDate);
        //var endDate = Date.parse(medInfo.endDate);
        //
        //var nbMonths = (+(endDate.toString('M')) - +(startDate.toString('M'))) + 1;
        //var angle = τ / (new Date(startDate.getYear(), +(startDate.toString('M')), 0).getDate());
        //var startWeekDay = medInfo.weekday !== undefined && eval("startDate.next()." + medInfo.weekday + "()");
        //
        //if (nbMonths === 1) {
        //    var innerRadius = getInnerSize(medBox)/2 + rWidth + rBuffer;
        //    createCircle(
        //        medBox,
        //        innerRadius,
        //        periodBackgroundColor
        //    );
        //    if (!startWeekDay) {
        //        createPosArc(
        //            medBox,
        //            innerRadius,
        //            startDate.getDate() * angle,
        //            (endDate.getDate()+1) * angle,
        //            periodColor
        //        );
        //    } else {
        //        var nbWeeks = 1 + Math.floor(Math.abs((+endDate) - (+startWeekDay)) / (7 * 8.64e7));
        //        for (var j = 0; j < nbWeeks; j++) {
        //            createPosArc(
        //                medBox,
        //                innerRadius,
        //                startWeekDay.getDate() * angle,
        //                (startWeekDay.getDate() + 1) * angle,
        //                periodColor
        //            );
        //            startWeekDay.addWeeks(1);
        //        }
        //    }
        //    var daysInThisMonth = daysInMonth(startDate);
        //    for(var i = 0; i < daysInThisMonth; i++) {
        //        createPosArc(medBox,
        //            innerRadius,
        //            ((i-0.01) / daysInThisMonth) * τ,
        //            ((i+0.01) / daysInThisMonth) * τ,
        //            periodColor);
        //        d3.select("#" + medBox.name)
        //            .append("text")
        //            .attr("class", "auxtext")
        //            .attr("x", (getInnerSize(medBox)/2 + 2.5*(rWidth + rBuffer)) * -Math.cos((((i+0.5) / daysInThisMonth) * τ) + Math.PI/2 ))
        //            .attr("y", (getInnerSize(medBox)/2 + 2.5*(rWidth + rBuffer)) * -Math.sin((((i+0.5) / daysInThisMonth) * τ) + Math.PI/2 ))
        //            .attr("text-anchor", "middle")
        //            .style("fill", periodColor)
        //            .style("font-size", auxTextFont)
        //            .style("text-anchor", "middle")
        //            .attr("dy", ".3em")
        //            .style("stroke", bodyBackgroundColor)
        //            .style("stroke-width", textStrokeWidth)
        //            .style("stroke-linejoin", "round")
        //            .style("paint-order", "stroke")
        //            .text(i+1);
        //    }
        //} else {
        //    for (var i = 0; i < nbMonths - 1; i++) {
        //        if (!startWeekDay) {
        //            createCircle(
        //                medBox,
        //                getInnerSize(medBox)/2 + ((i + 1) * (rWidth + rBuffer)),
        //                periodColor);
        //        } else {
        //            createCircle(
        //                medBox,
        //                getInnerSize(medBox)/2 + ((i + 1) * (rWidth + rBuffer)),
        //                periodBackgroundColor);
        //            for (var j = 0; j < 5; j++) {
        //                if (+(startWeekDay.toString('M')) === (new Date(medInfo.startDate).getMonth() + (i))) {
        //                    createPosArc(
        //                        medBox,
        //                        getInnerSize(medBox)/2 + ((i + 1) * (rWidth + rBuffer)),
        //                        startWeekDay.getDate() * angle,
        //                        (startWeekDay.getDate() + 1) * angle,
        //                        periodColor
        //                    );
        //                    startWeekDay.addWeeks(1);
        //                }
        //            }
        //        }
        //
        //        var daysInThisMonth = daysInMonth(startWeekDay);
        //        for(var j = 0; j < daysInThisMonth; j++) {
        //            createPosArc(medBox,
        //                getInnerSize(medBox)/2 + ((i + 1) * (rWidth + rBuffer)),
        //                ((j-0.01) / daysInThisMonth) * τ,
        //                ((j+0.01) / daysInThisMonth) * τ,
        //                periodColor);
        //        }
        //
        //    }
        //    // laatste maand
        //    createCircle(
        //        medBox,
        //        getInnerSize(medBox)/2 + (nbMonths * (rWidth + rBuffer)),
        //        periodBackgroundColor
        //    );
        //    if (!startWeekDay) {
        //        createPosArc(
        //            medBox,
        //            getInnerSize(medBox)/2 + (nbMonths * (rWidth + rBuffer)),
        //            0,
        //            (endDate.getDate() + 1) * angle,
        //            periodColor
        //        );
        //    } else {
        //        var nbWeeks = 1 + Math.floor(Math.abs((+endDate) - (+startWeekDay)) / (7 * 8.64e7));
        //        for (var j = 0; j < nbWeeks; j++) {
        //            createPosArc(
        //                medBox,
        //                getInnerSize(medBox)/2 + ((nbMonths) * (rWidth + rBuffer)),
        //                (startWeekDay.getDate() - 1) * angle,
        //                ((startWeekDay.getDate() - 1) + 1) * angle,
        //                periodColor
        //            );
        //            startWeekDay.addWeeks(1);
        //        }
        //    }
        //    var daysInThisMonth = daysInMonth(endDate)
        //    for(var j = 0; j < daysInThisMonth; j++) {
        //        createPosArc(medBox,
        //            getInnerSize(medBox)/2 + ((i + 1) * (rWidth + rBuffer)),
        //            ((j-0.01) / daysInThisMonth) * τ,
        //            ((j+0.01) / daysInThisMonth) * τ,
        //            periodColor);
        //
        //        d3.select("#" + medBox.name)
        //            .append("text")
        //            .attr("class", "auxtext")
        //            .attr("x", (getInnerSize(medBox)/2 + ((nbMonths+1.5) * (rWidth + rBuffer))) * -Math.cos((((j+0.5) / daysInThisMonth) * τ) + Math.PI/2 ))
        //            .attr("y", (getInnerSize(medBox)/2 + ((nbMonths+1.5) * (rWidth + rBuffer))) * -Math.sin((((j+0.5) / daysInThisMonth) * τ) + Math.PI/2 ))
        //            .style("fill", periodColor)
        //            .style("font-size", auxTextFont)
        //            .style("text-anchor", "middle")
        //            .attr("dy", ".3em")
        //            .style("stroke", bodyBackgroundColor)
        //            .style("stroke-width", textStrokeWidth)
        //            .style("stroke-linejoin", "round")
        //            .style("paint-order", "stroke")
        //            .text(j+1);
        //    }
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