var LIVE2DCUBISMCORE = Live2DCubismCore
//var baseModelPath = window.location.protocol+'//cdn.'+ window.location.host+"/Resource/live2d/";
var baseModelPath = "/live2d/assets/" ;
var modelNames = ["xuefeng_3"];
var modelPath;
var app;
var tag_target = '.waifu';
var idleIndex;
var loginIndex;
var homeIndex;
var touch_body;
var touch_head;
var touch_special;
var mainIndex;
var model_x = -5;
var model_y = 0;
var modelWidth = 360;
var modelHight = 450;
var scale = 30;
var startTime;
function loadMotions(motions){
    var motionCount = 0 ;
    if(motions.length >0){
        for (var i = 0; i < motions.length; i++) {
            PIXI.loader.add('motion'+ ( motionCount + 1) , modelPath.substr(0, modelPath.lastIndexOf('/') + 1) + motions[i].File, { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });
            if(motions[i].File.indexOf('idle')!= -1){
                idleIndex = motionCount;
            }else if(motions[i].File.indexOf('login') != -1){
                loginIndex = motionCount;
            }else if(motions[i].File.indexOf('home') != -1){
                homeIndex = motionCount;
            }else if(motions[i].File.indexOf('touch_body') != -1){
                touch_bodyIndex = motionCount;
			}else if(motions[i].File.indexOf('touch_head') != -1){
                touch_headIndex = motionCount;
			}else if(motions[i].File.indexOf('touch_special') != -1){
                touch_specialIndex = motionCount;
                //添加main动作
			}
            else if(motions[i].File.indexOf('main') != -1){
                mainIndex = motionCount;
			}
            motionCount ++ ;
            console.info("已加载动作文件" +motions[i].File);
        }
    }else{
        console.error('Not find motions')
    }
}
function loadModel(){
    //var modelName =  "shengluyisi_3";
	var modelName =  modelNames[Math.floor(Math.random() * modelNames.length )];
    console.info("已加载模型" + modelName)
    modelPath =  baseModelPath + modelName +"/"+ modelName + ".model3.json";
    var ajax = null;
    if(window.XMLHttpRequest){ajax = new XMLHttpRequest();}else if(window.ActiveObject){
        ajax = new ActiveXObject("Microsoft.XMLHTTP");
    }else{
        throw new Error('loadModelJsonError');
    }  
    ajax.open('GET', modelPath, true);
    ajax.send();
    ajax.onreadystatechange = function(){
        if(ajax.readyState == 4){  
            if(ajax.status == 200){ 
                var data = JSON.parse(ajax.responseText)
                initModel(data);
            }else{
                console.error('Response error,Code:' + ajax.status);
            }
        }
    };
}
function initModel(data){
    var model3Obj = {data:data,url: modelPath.substr(0, modelPath.lastIndexOf('/') + 1)};
    PIXI.loader.reset();
    PIXI.utils.destroyTextureCache();
    for (var key in data.FileReferences.Motions) {
        loadMotions(data.FileReferences.Motions[key]);
    }
    new LIVE2DCUBISMPIXI.ModelBuilder().buildFromModel3Json(
     PIXI.loader
       .on("start", loadStartHandler)
       //.on("progress", loadProgressHandler)
       .on("complete", loadCompleteHandler),
     model3Obj,
     setModel
    );
}
function setModel(model){
    var canvas = document.querySelector(tag_target);
    var view = canvas.querySelector('canvas');
    if(app != null){app.stop();}
    app = new PIXI.Application(modelWidth, modelHight, {transparent: true ,view:view});
    app.stage.addChild(model);
    app.stage.addChild(model.masks);
    var motions = setMotions(model,PIXI.loader.resources);
    setMouseTrick(model,app,canvas,motions);
    var onResize = function (event) {
        if (event === void 0) { event = null; }
            var width = modelWidth;
            var height = modelHight;
            app.view.style.width = width + "px";
            app.view.style.height = height + "px";
            app.renderer.resize(width, height);
            model.position = new PIXI.Point(modelWidth/2 + model_x, modelHight/2 + model_y);
            model.scale = new PIXI.Point(scale, scale);
            model.masks.resize(app.view.width, app.view.height);
    };
    onResize();
    window.onresize = onResize;
}
function setMotions(model,resources){
    var motions = [];
    for (var key in resources) {
        if(key.indexOf('motion') != -1){
            motions.push(LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(resources[key].data)); 
        }
    }
    var timeOut;
    if(motions.length > 0){
        window.clearTimeout(timeOut);
        model.animator.addLayer("motion", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1.0);
        if(null != loginIndex && null != idleIndex){
            model.animator.getLayer("motion").play(motions[loginIndex]);
            timeOut = setTimeout( function(){model.animator.getLayer("motion").play(motions[idleIndex]);}, motions[loginIndex].duration * 1000 );
        }else{
            model.animator.getLayer("motion").play(motions[0]);
        }
    }
    return motions;
}
function setMouseTrick(model,app,canvas,motions){
    var rect = canvas.getBoundingClientRect();
    var center_x = modelWidth/2 + rect.left, center_y = modelHight/2 + rect.top,center_z = modelWidth/2 + modelHight/2;
    var mouse_x = center_x, mouse_y = center_y,mouse_z = center_z;
    var angle_x = model.parameters.ids.indexOf("ParamAngleX");
    if(angle_x < 0){ angle_x = model.parameters.ids.indexOf("PARAM_ANGLE_X"); }

    var angle_y = model.parameters.ids.indexOf("ParamAngleY");
    if(angle_y < 0){ angle_y = model.parameters.ids.indexOf("PARAM_ANGLE_Y"); }

    var angle_z = model.parameters.ids.indexOf("ParamAngleZ");
    if(angle_z < 0){ angle_x = model.parameters.ids.indexOf("PARAM_ANGLE_Z"); }

	var eye_x = model.parameters.ids.indexOf("ParamEyeBallX");
    if(eye_x < 0){ eye_x = model.parameters.ids.indexOf("PARAM_EYE_BALL_X"); }
    var eye_y = model.parameters.ids.indexOf("ParamEyeBallY");
    if(eye_y < 0){ eye_y = model.parameters.ids.indexOf("PARAM_EYE_BALL_Y"); }
	
	var body_x = model.parameters.ids.indexOf("ParamBodyAngleX");
    if( body_x < 0){ body_x = model.parameters.ids.indexOf("Param_BodyAngle_X"); }

    var body_y = model.parameters.ids.indexOf("ParamAngleY");
    if(body_y < 0){ body_y = model.parameters.ids.indexOf("Param_BodyAngle_Y"); }
    // 适配模型的ParamAngleY
    var body_Yy = model.parameters.ids.indexOf("ParamBodyAngleYy"); 
    if(body_y < 0){ body_Yy = model.parameters.ids.indexOf("ParamBodyAngleYy"); }

    var body_z = model.parameters.ids.indexOf("ParamBodyAngleZ");
    if( body_y < 0){ body_x = model.parameters.ids.indexOf("ParamBodyAngleZ"); }
    app.ticker.add(function (deltaTime) {
        rect = canvas.getBoundingClientRect();
        center_x = modelWidth/2 + rect.left, center_y = modelHight/2 + rect.top;
        var x = mouse_x - center_x;
        var y = mouse_y - center_y;
        // 添加头部z角度
        var z = y/2; 
        model.parameters.values[angle_x] = x * 0.2;
        model.parameters.values[angle_y] = -y * 0.2;
        model.parameters.values[angle_z] = -z * 0.1;
        model.parameters.values[eye_x] = x * 0.01;
        model.parameters.values[eye_y] = -y * 0.01;
		model.parameters.values[body_x] = x * 0.1;
        model.parameters.values[body_y] = -y * 0.2;
        model.parameters.values[body_Yy] = -z * 0.1;
        model.parameters.values[body_z] = -z * 0.1;
        model.update(deltaTime);
        model.masks.update(app.renderer);
    });
    var scrollElm = bodyOrHtml();
    var mouseMove;
    document.body.addEventListener("mousemove", function(e){
        window.clearTimeout(mouseMove);
        mouse_x = e.pageX - scrollElm.scrollLeft;
        mouse_y = e.pageY - scrollElm.scrollTop;
        mouseMove =  window.setTimeout(function(){mouse_x = center_x , mouse_y = center_y} , 5000);
    });
    var timeOut;
    canvas.addEventListener("click", function(e){
        window.clearTimeout(timeOut);
        if(motions.length == 0){ return; }
        if(rect.left < mouse_x && mouse_x < (rect.left + rect.width) && rect.top < mouse_y && mouse_y < (rect.top + rect.height)){
            var rand = Math.floor(Math.random() * motions.length);
            model.animator.getLayer("motion").stop();
            model.animator.getLayer("motion").play(motions[rand]);
            console.info("播放动作："+ rand);
            if(null != idleIndex){
                timeOut = setTimeout( function(){model.animator.getLayer("motion").play(motions[idleIndex]);}, motions[rand].duration * 3000 );
            }
        }
    });
    var onfocusTime;
    sessionStorage.setItem('Onblur', '0');
    window.onblur = function(e){
        if('0' == sessionStorage.getItem('Onblur')){
            onfocusTime = setTimeout(function(){sessionStorage.setItem('Onblur','1');},30000);
        }
    };
    window.onfocus = function(e){
        window.clearTimeout(onfocusTime);
        if(motions.length > 0){
            if('1' == sessionStorage.getItem('Onblur')){
                model.animator.getLayer("motion").stop();
                if(null != loginIndex && null != idleIndex){
                    model.animator.getLayer("motion").play(motions[homeIndex]);
                    onfocusTime = setTimeout( function(){model.animator.getLayer("motion").play(motions[idleIndex]);sessionStorage.setItem('Onblur', '0');}, motions[homeIndex].duration * 1000 );
                }else{
                    model.animator.getLayer("motion").play(motions[0]);
                }
            }
        }
    };
}
function bodyOrHtml(){
    if('scrollingElement' in document){ return document.scrollingElement; }
    if(navigator.userAgent.indexOf('WebKit') != -1){ return document.body; }
    return document.documentElement;
}
function loadStartHandler() {
    startTime = new Date();
}
function loadProgressHandler(loader) {
    console.log("progress: " + Math.round(loader.progress) + "%");
}
function loadCompleteHandler(){
    var loadTime = new Date().getTime() - startTime.getTime();
    console.log('Model initialized in '+ loadTime/1000 + ' second');
    loadTips();
    PIXI.loader.off("start", loadStartHandler);
    PIXI.loader.off("progress", loadProgressHandler);
    PIXI.loader.off("complete", loadCompleteHandler);
}
