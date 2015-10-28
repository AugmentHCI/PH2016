$.get('testdata/test.html', function (data) {
    var result = data;
    var sideEffects = $("#section-side-effects.section-body",result).children('ul').children('li');
    var sideEffectsSize = sideEffects.size();
    for(var i =0; i < sideEffectsSize ; i++) {
        console.log(sideEffects.get(i).innerText);
    }
});