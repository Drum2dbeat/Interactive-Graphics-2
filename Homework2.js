"use strict";

var canvas;
var gl;
var program;

var animateFlag = false;
var instanceMatrix;
var texture1;
var texture2;
var projectionMatrix;
var modelViewMatrix;
var modelViewMatrixLoc;



var vertices = [

    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];
var texCoordsArray = [];
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var TORSO_ID = 0;
var  NECK_ID  = 1;
var  NECK1_ID= 1;
var  NECK2_ID= 16;
var  LEFT_UPPER_FRONT_LEG_ID= 2;
var  LEFT_LOWER_FRONT_LEG_ID= 3;
var  RIGHT_UPPER_FRONT_LEG_ID= 4;
var  RIGHT_LOWER_FRONT_LEG_ID= 5;
var  LEFT_UPPER_BACK_LEG_ID= 6;
var  LEFT_LOWER_BACK_LEG_ID= 7;
var  RIGHT_UPPER_BACK_LEG_ID= 8;
var  RIGHT_LOWER_BACK_LEG_ID= 9;
var  UPPER_TAIL_ID= 10;
var  UPPER_TAIL1_ID= 10;
var  UPPER_TAIL2_ID = 15;
var  LOWER_TAIL_ID= 11;
var  HEAD_ID = 12;
var  LEFT_EAR_ID= 13;
var  RIGHT_EAR_ID= 14;
var  TORSO_ID1= 15;

var TorsoLength = 9.0;
var TorsoWidth = 4.2;
var UpperFrontLegHeight = 3.2;
var LowerFrontLegHeight = 2.2;
var UpperFrontLegWidth  = 1.2;
var LowerFrontLegWidth  = 0.85;
var UpperBackLegWidth  = 1.2;
var LowerBackLegWidth  = 0.85;
var LowerBackLegHeight = 2.2;
var UpperBackLegHeight = 3.2;
var NeckHeight = 3.4;
var NeckWidth = 2.0;
var NeckDepth = 1.4;
var UpperTailWidth = 0.6;
var UpperTailHeight =1.3;
var LowerTailWidth = 0.4;
var LowerTailHeight = 3.0;
var LowerTailDepth = 1.0;
var HeadWidth = 2.2;
var HeadLength = 3.2;
var EarWidth = 0.5;
var EarHeight = 1.2;

var HorizontalBarDepth = 1;
var HorizontalBarHeight = 1;
var HorizontalBarLength = 10;
var xPosition = -30;
var yPosition = 0;

var numNodes = 15;

var theta = [90, 30, 180, 0.0, 180, 0.0, 180, 0.0, 180, 0.0, -20, -50, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

var stack = [];

var figure = [];
for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var figureObstacle = [];
var numObstacleNodes = 3;
var stackObstacle = [];
var HorizontalBarId = 0;
var VerticalBar1Id = 1;
var VerticalBar2Id = 2;
for (var i=0; i<numObstacleNodes; i++) figureObstacle[i] = createNode(null, null, null, null);

var vBuffer;
var modelViewLoc;

var pointsArray = [];

// THE COLORS THAT WE SHOULD RENDER THEM TO THE NODES
var colors = [];
var black = [ 0.0, 0.0, 0.0, 0.9 ];
var grey = [0.8, 0.8, 0.8, 1.0];
var white = [1.0, 0.0 , 0.0, 0.0]
var red = [1.0, 0.0 , 0.0, 1]

//-------------------------------------------

function scale4(a, b, c) {
   var result = mat4();
   result[0][0] = a;
   result[1][1] = b;
   result[2][2] = c;
   return result;
}

//--------------------------------------------

function configureTexture(color) {

    var texSize = 256;
    var numChecks = 8;
    var c;
    var image1 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var patchx = Math.floor(i/(texSize/numChecks));
            var patchy = Math.floor(j/(texSize/numChecks));
            if(patchx%2 ^ patchy%2) c = 255;
            else c = 0;
            image1[4*i*texSize+4*j] = c;
            image1[4*i*texSize+4*j+1] = c;
            image1[4*i*texSize+4*j+2] = c;
            image1[4*i*texSize+4*j+3] = 255;
        }
    }

    var image2 = new Uint8Array(4*texSize*texSize);

    for ( var i = 0; i < texSize; i++ ) {
        for ( var j = 0; j <texSize; j++ ) {
            var delta;
            if (color == "black") delta = 0;
            else if (color == "leftToRight") delta = (texSize - j)/texSize * 255;
            else if (color =="rightToLeft") delta = j/texSize * 255;
            image2[4*i*texSize+4*j] = delta;
            image2[4*i*texSize+4*j+1] = delta;
            image2[4*i*texSize+4*j+2] = delta;
            image2[4*i*texSize+4*j+3] = 255;
           }
    }

    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image1);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    texture2 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image2);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex0"), 0);

    gl.activeTexture( gl.TEXTURE1 );
    gl.bindTexture( gl.TEXTURE_2D, texture2 );
    gl.uniform1i(gl.getUniformLocation( program, "Tex1"), 1); 

}

//.................

function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

//...............

function initNodes(Id) {

    var m = mat4();

    switch(Id) {

    case TORSO_ID:
    case TORSO_ID1:
    m = translate(xPosition,yPosition,0);
    m = mult(m,rotate(theta[TORSO_ID], 0, 1, 0 ));
    m = mult(m, rotate(theta[TORSO_ID1], 0, 0, 1));
    figure[TORSO_ID] = createNode( m, torso, null, NECK_ID );
    break;

    case NECK_ID:
    case NECK1_ID:
    case NECK2_ID:

    m = translate(0.0, TorsoWidth-0.5 , 0.5*TorsoLength-1);
	m = mult(m, rotate(theta[NECK1_ID], 1, 0, 0));
	m = mult(m, rotate(theta[NECK2_ID], 0, 1, 0));
    m = mult(m, translate(0.0, 0.0, 0.0 ));
    figure[NECK_ID] = createNode( m, neck, LEFT_UPPER_FRONT_LEG_ID, HEAD_ID);
    break;

    case HEAD_ID:
    m = translate(0.0, NeckHeight -0.5*HeadWidth + 0.25, HeadLength*1/4);
	m = mult(m, rotate(theta[HEAD_ID], 1, 0, 0));
    figure[HEAD_ID] = createNode( m, head, LEFT_EAR_ID, null);
    break;

    case LEFT_EAR_ID:
    m = translate(-0.5*NeckDepth, NeckHeight, 0.0);
    m = mult(m, rotate(theta[LEFT_EAR_ID], 1, 0, 0));
    figure[LEFT_EAR_ID] = createNode( m, leftEar, RIGHT_EAR_ID, null );
    break;

    case RIGHT_EAR_ID:
    m = translate(0.5*NeckDepth, NeckHeight, 0.0);
    m = mult(m, rotate(theta[RIGHT_EAR_ID], 1, 0, 0));
    figure[RIGHT_EAR_ID] = createNode( m, rightEar, null, null );
    break;

    case LEFT_UPPER_FRONT_LEG_ID:

    m = translate(-(TorsoWidth/2 - UpperFrontLegWidth/2) + 0.25, 0.1*UpperFrontLegHeight , 0.5*TorsoLength - 1);
	m = mult(m, rotate(theta[LEFT_UPPER_FRONT_LEG_ID], 1, 0, 0));
    figure[LEFT_UPPER_FRONT_LEG_ID] = createNode( m, leftUpperFrontLeg,  RIGHT_UPPER_FRONT_LEG_ID,  LEFT_LOWER_FRONT_LEG_ID);
    break;
    
    case RIGHT_UPPER_FRONT_LEG_ID:

    m = translate(TorsoWidth/2 - UpperFrontLegWidth/2 - 0.25, 0.1*UpperFrontLegHeight, 0.5*TorsoLength - 1);
	m = mult(m, rotate(theta[RIGHT_UPPER_FRONT_LEG_ID], 1, 0, 0));
    figure[RIGHT_UPPER_FRONT_LEG_ID] = createNode( m, rightUpperFrontLeg,  LEFT_UPPER_BACK_LEG_ID,  RIGHT_LOWER_FRONT_LEG_ID);
    break;

    case LEFT_UPPER_BACK_LEG_ID:

    m = translate(-(TorsoWidth/2 - UpperBackLegWidth/2) + 0.25, 0.1*UpperBackLegHeight, -0.5*TorsoLength + 1); 
	m = mult(m , rotate(theta[LEFT_UPPER_BACK_LEG_ID], 1, 0, 0));
    figure[LEFT_UPPER_BACK_LEG_ID] = createNode( m, leftUpperBackLeg,  RIGHT_UPPER_BACK_LEG_ID,  LEFT_LOWER_BACK_LEG_ID);
    break;

    case RIGHT_UPPER_BACK_LEG_ID:

    m = translate(TorsoWidth/2 - UpperBackLegWidth/2 - 0.25, 0.1*UpperBackLegHeight, -0.5*TorsoLength + 1); 
	m = mult(m, rotate(theta[RIGHT_UPPER_BACK_LEG_ID], 1, 0, 0));
    figure[RIGHT_UPPER_BACK_LEG_ID] = createNode( m, rightUpperBackLeg,  UPPER_TAIL_ID,  RIGHT_LOWER_BACK_LEG_ID);
    break;

    case UPPER_TAIL_ID:
    case UPPER_TAIL1_ID:
    case UPPER_TAIL2_ID:

    m = translate(0.0, TorsoWidth + 0.5 * UpperTailWidth, - 0.5*TorsoLength+0.5*UpperTailHeight);
	m = mult(m, rotate(theta[UPPER_TAIL1_ID], 1, 0, 0));
	m = mult(m, rotate(theta[UPPER_TAIL2_ID], 0, 1, 0));
    m = mult(m, translate(0.0, -0.5 * UpperTailWidth, -0.5*UpperTailHeight));
    figure[UPPER_TAIL_ID] = createNode( m, upperTail, null,  LOWER_TAIL_ID);
    break;

    case LOWER_TAIL_ID:
    m = translate(0.0, 0.0 , - UpperTailHeight);
    m = mult(m, rotate(theta[LOWER_TAIL_ID], 1, 0, 0));
    figure[LOWER_TAIL_ID] = createNode( m, lowerTail, null, null);
    break;

    case LEFT_LOWER_FRONT_LEG_ID:

    m = translate(0.0, UpperFrontLegHeight - 0.2, 0.0);
    m = mult(m, rotate(theta[LEFT_LOWER_FRONT_LEG_ID], 1, 0, 0));
    figure[LEFT_LOWER_FRONT_LEG_ID] = createNode( m, leftLowerFrontLeg, null, null );
    break;

    case RIGHT_LOWER_FRONT_LEG_ID:

    m = translate(0.0, UpperFrontLegHeight - 0.2, 0.0);
    m = mult(m, rotate(theta[RIGHT_LOWER_FRONT_LEG_ID], 1, 0, 0));
    figure[RIGHT_LOWER_FRONT_LEG_ID] = createNode( m, rightLowerFrontLeg, null, null );
    break;

    case LEFT_LOWER_BACK_LEG_ID:

    m = translate(0.0, UpperBackLegHeight - 0.2, 0.0);
    m = mult(m, rotate(theta[LEFT_LOWER_BACK_LEG_ID], 1, 0, 0));
    figure[LEFT_LOWER_BACK_LEG_ID] = createNode( m, leftLowerBackLeg, null, null );
    break;

    case RIGHT_LOWER_BACK_LEG_ID:

    m = translate(0.0, UpperBackLegHeight - 0.2, 0.0);
    m = mult(m, rotate(theta[RIGHT_LOWER_BACK_LEG_ID], 1, 0, 0));
    figure[RIGHT_LOWER_BACK_LEG_ID] = createNode( m, rightLowerBackLeg, null, null );
    break;
    }

}


//.................

function traverse(Id) {
   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child);
   modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling);
}


function torso() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5*TorsoWidth, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4( TorsoWidth, TorsoWidth, TorsoLength));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
   
    colorCube(grey);
    for(var i =0; i<6; i++){
        
        if (i == 0){
            configureTexture();
            gl.uniform1f ( gl.getUniformLocation(program, "useTexture"), 1.0 ); 
        }
        else {
            if (i==4) configureTexture("black");
            else if (i == 1 || i == 2) configureTexture("leftToRight");

            else configureTexture("rightToLeft");

            gl.uniform1f(gl.getUniformLocation(program, "useTexture"),2.0 )
            }
        gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
    }
}

function neck() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * NeckHeight, 0.0 ));
	instanceMatrix = mult(instanceMatrix, scale4(NeckDepth, NeckHeight, NeckWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 ) 
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function head(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(HeadWidth, HeadWidth, HeadLength) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftEar(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, EarHeight*0.5, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(EarWidth, EarHeight, EarWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightEar(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, EarHeight*0.5, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(EarWidth, EarHeight, EarWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftUpperFrontLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperFrontLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperFrontLegWidth, UpperFrontLegHeight, UpperFrontLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerFrontLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * LowerFrontLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerFrontLegWidth, LowerFrontLegHeight, LowerFrontLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperFrontLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperFrontLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperFrontLegWidth, UpperFrontLegHeight, UpperFrontLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerFrontLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * LowerFrontLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerFrontLegWidth, LowerFrontLegHeight, LowerFrontLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function  leftUpperBackLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperBackLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperBackLegWidth, UpperBackLegHeight, UpperBackLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function leftLowerBackLeg() {

    instanceMatrix = mult(modelViewMatrix, translate( 0.0, 0.5 * LowerBackLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerBackLegWidth, LowerBackLegHeight, LowerBackLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightUpperBackLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * UpperBackLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperBackLegWidth, UpperBackLegHeight, UpperBackLegWidth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function rightLowerBackLeg() {

    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * LowerBackLegHeight, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerBackLegWidth, LowerBackLegHeight, LowerBackLegWidth) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function upperTail(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -0.5 * UpperTailWidth, -0.5*UpperTailHeight) );
	instanceMatrix = mult(instanceMatrix, scale4(UpperTailWidth, UpperTailWidth, UpperTailHeight) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function lowerTail(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, -0.5*LowerTailHeight) );
	instanceMatrix = mult(instanceMatrix, scale4(LowerTailWidth, LowerTailDepth, LowerTailHeight) )
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}


function traverseObstacle(Id) {

   if(Id == null) return;
   stackObstacle.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figureObstacle[Id].transform);
   figureObstacle[Id].render();
   if(figureObstacle[Id].child != null) traverseObstacle(figureObstacle[Id].child);
   modelViewMatrix = stackObstacle.pop();
   if(figureObstacle[Id].sibling != null) traverseObstacle(figureObstacle[Id].sibling);

}
//................

function initObstacleNodes(Id) {

    var m = mat4();
    switch(Id) {

    case HorizontalBarId:

    m = translate(23, TorsoWidth , 0.0);
    figureObstacle[HorizontalBarId] = createNode( m, horizontalBar, null, VerticalBar1Id );
    break;

    case VerticalBar1Id:

    m = translate(0.0, 0.0 , HorizontalBarLength*0.5 + HorizontalBarDepth*0.5 )
    m = mult(m, rotate(180,1,0,0));
    figureObstacle[VerticalBar1Id] = createNode( m, verticalBar, VerticalBar2Id, null );
    break;

    case VerticalBar2Id:

    m = translate(0.0, 0.0 , -HorizontalBarLength*0.5 - HorizontalBarDepth*0.5)
    m = mult(m, rotate(180,1,0,0));
    figureObstacle[VerticalBar2Id] = createNode( m, verticalBar, null, null );
    break;

    }
}

function horizontalBar(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, HorizontalBarHeight*0.5, 0.0) );
    instanceMatrix = mult(instanceMatrix, scale4(HorizontalBarDepth, HorizontalBarHeight, HorizontalBarLength) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function verticalBar(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, (TorsoWidth + UpperFrontLegHeight + LowerFrontLegHeight)/2 -HorizontalBarDepth*'.5' , 0.0) );
    instanceMatrix =  mult(instanceMatrix,scale4(HorizontalBarDepth, TorsoWidth + UpperFrontLegHeight + LowerFrontLegHeight +5, HorizontalBarDepth)) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}

function verticalBar2(){
    instanceMatrix = mult(instanceMatrix, scale4(HorizontalBarDepth, 4, HorizontalBarDepth) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    colorCube(red);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);
}
//.................
function cube(){
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

//..................

function quad(a, b, c, d) {
    pointsArray.push(vertices[a]);
    pointsArray.push(vertices[b]);
    pointsArray.push(vertices[c]);
    pointsArray.push(vertices[d]);
}
//.................

function colorCube(color){
    colors = []
    for(var i = 0; i < 24; i++) colors.push(color);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

}
//................

function textureCube(){

    for(var i = 0; i < 6; i++){
        texCoordsArray.push(texCoord[0]);
        texCoordsArray.push(texCoord[1]);
        texCoordsArray.push(texCoord[2]);
        texCoordsArray.push(texCoord[3]);
    }
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );


}



// THE ANIMATION........
var step_Tail = 1;
var step_Tail1 = + 0.8; 
var step_Neck = 0.5;
var nnnn = 0;
var front_LMove = 2;
var front_RMove = 2;
var back_LMove = 2;
var back_RMove = 2;
var angle = 0;
var deltaAngle = -1;

theta[RIGHT_UPPER_FRONT_LEG_ID] = theta[RIGHT_UPPER_FRONT_LEG_ID] - 13; 
theta[RIGHT_LOWER_FRONT_LEG_ID ] = theta[RIGHT_LOWER_FRONT_LEG_ID] + 13*1.5;

theta[LEFT_UPPER_BACK_LEG_ID] = theta[RIGHT_UPPER_BACK_LEG_ID]  - 10; 
theta[RIGHT_UPPER_BACK_LEG_ID ] = theta[RIGHT_UPPER_BACK_LEG_ID] - 13 - 10;
theta[LEFT_LOWER_BACK_LEG_ID ] = theta[RIGHT_LOWER_BACK_LEG_ID] + 10*1.5;
theta[RIGHT_LOWER_BACK_LEG_ID ] = theta[RIGHT_LOWER_BACK_LEG_ID] + 13*1.5 + 10*1.5;

//..................
var maxDeltaY = UpperFrontLegHeight - UpperFrontLegHeight*Math.cos((180-140)*Math.PI/180) + LowerFrontLegHeight - LowerFrontLegHeight*Math.cos(60*Math.PI/180);
var x_interp = 0;
var deltaX = 1;
var a = maxDeltaY/21;
var first = true;
var b;
var deltaJump = 0;
var storeY;
var thetaBeforeJump;
var startJumping = false;
var raising = 1;

function animation(){

    if (theta[TORSO_ID] != 90 || theta[TORSO_ID1] != 0) {
        theta[TORSO_ID] = 90;
        theta[TORSO_ID1] = 0;
        alert("HORSE MUST BE AVOID THE OBSTACLE");
    }

    
    console.log(xPosition)
    if (startJumping == true) step_Tail = step_Tail1; 
    if (xPosition > 32.25) { 
        step_Neck = 0;
        step_Tail = 0;
    }
    theta[LOWER_TAIL_ID] = theta[LOWER_TAIL_ID] + step_Tail;
    theta[NECK1_ID] = theta[NECK1_ID] + step_Neck;
    initNodes(LOWER_TAIL_ID)

    if (xPosition < 10){

        //TO TRANSLATE
        xPosition = xPosition + 1.5/6; 

        //TO MAKE THE Linear Interpolation
        yPosition = -a*x_interp*0.55;
        x_interp = x_interp + deltaX; 

        //TO ANIMATE THE FRONT LEGS 
        if (theta[LEFT_UPPER_FRONT_LEG_ID] <= 140 || theta[LEFT_UPPER_FRONT_LEG_ID] >= 180) {
            front_LMove = - front_LMove; 

            step_Neck = - step_Neck;
            // TO ANIMATE THE TAIL 
            step_Tail = - step_Tail;
        }
        if ( theta[RIGHT_UPPER_FRONT_LEG_ID] <= 140 || theta[RIGHT_UPPER_FRONT_LEG_ID] >= 180) {
            front_RMove = - front_RMove;
        }
        theta[LEFT_UPPER_FRONT_LEG_ID] = theta[LEFT_UPPER_FRONT_LEG_ID] + front_LMove;
        theta[ RIGHT_UPPER_FRONT_LEG_ID] = theta[RIGHT_UPPER_FRONT_LEG_ID] + front_RMove ;
        theta[ LEFT_LOWER_FRONT_LEG_ID] = theta[LEFT_LOWER_FRONT_LEG_ID] - front_LMove*(1.5); 
        theta[ RIGHT_LOWER_FRONT_LEG_ID] = theta[RIGHT_LOWER_FRONT_LEG_ID] - front_RMove*(1.5);

        //TO ANIMATE THE BACK LEGS 
        if (theta[ LEFT_UPPER_BACK_LEG_ID] <= 140 || theta[LEFT_UPPER_BACK_LEG_ID] >= 180){
            deltaX = - deltaX; 
            back_LMove = - back_LMove; 
            }
        if ( theta[ RIGHT_UPPER_BACK_LEG_ID] <= 140 || theta[RIGHT_UPPER_BACK_LEG_ID] >= 180) back_RMove = - back_RMove;
        theta[LEFT_UPPER_BACK_LEG_ID] = theta[LEFT_UPPER_BACK_LEG_ID] + back_LMove;
        theta[RIGHT_UPPER_BACK_LEG_ID] = theta[RIGHT_UPPER_BACK_LEG_ID] + back_RMove ;
        theta[ LEFT_LOWER_BACK_LEG_ID] = theta[LEFT_LOWER_BACK_LEG_ID] - back_LMove*(1.5); 
        theta[ RIGHT_LOWER_BACK_LEG_ID] = theta[RIGHT_LOWER_BACK_LEG_ID] - back_RMove*(1.5);
    }

      // THE JUMPING HAS TWO SETPS
    else{

        if (first){
           
            x_interp = 0;
            b = UpperFrontLegHeight - UpperFrontLegHeight*Math.cos((180-theta[ LEFT_UPPER_FRONT_LEG_ID])*Math.PI/180)
            + LowerFrontLegHeight - LowerFrontLegHeight*Math.cos(1.5*(180-theta[LEFT_UPPER_FRONT_LEG_ID])*Math.PI/180);
            var yOfT = UpperFrontLegHeight - UpperFrontLegHeight*Math.cos((180-130)*Math.PI/180)
            + LowerFrontLegHeight - LowerFrontLegHeight*Math.cos(1.5*(180-130)*Math.PI/180);
            a = (yOfT - b)/51;
        }


        // STEP 1: BENDING THE LEGS
        if (theta[LEFT_UPPER_FRONT_LEG_ID] >= 130 && startJumping == false){
            theta[LEFT_UPPER_FRONT_LEG_ID] = theta[LEFT_UPPER_FRONT_LEG_ID] - 2;
            theta[ LEFT_LOWER_FRONT_LEG_ID] = theta[LEFT_LOWER_FRONT_LEG_ID] + 3;
            x_interp = x_interp - 1;

            
            yPosition = a*x_interp + b;
            xPosition = xPosition + 1/6*0.3;

            storeY = yPosition; 
            thetaBeforeJump = theta[LEFT_UPPER_FRONT_LEG_ID]; 

         //TO EFFECT ON THEM
            step_Tail = -0.5;
            step_Neck =  0.2;
        }

        if (theta[ RIGHT_UPPER_FRONT_LEG_ID] >= 130 && startJumping == false){
            theta[RIGHT_UPPER_FRONT_LEG_ID] = theta[RIGHT_UPPER_FRONT_LEG_ID] - 2;
            theta[ RIGHT_LOWER_FRONT_LEG_ID ] = theta[RIGHT_LOWER_FRONT_LEG_ID] + 3;
        }
        if (theta[ LEFT_UPPER_BACK_LEG_ID] >= 130 && startJumping == false){
            theta[LEFT_UPPER_BACK_LEG_ID] = theta[LEFT_UPPER_BACK_LEG_ID] - 2;
            theta[ LEFT_LOWER_BACK_LEG_ID] = theta[LEFT_LOWER_BACK_LEG_ID] + 3;
        }
        if (theta[ RIGHT_UPPER_BACK_LEG_ID] >= 130 && startJumping == false){
            theta[RIGHT_UPPER_BACK_LEG_ID] = theta[RIGHT_UPPER_BACK_LEG_ID] - 2 ;
            theta[ RIGHT_LOWER_BACK_LEG_ID] = theta[RIGHT_LOWER_BACK_LEG_ID] + 3;
        }
        first = false;

        // STEP 2: JUMP!
        if (thetaBeforeJump <= 130 && deltaJump <= 130){   
            startJumping = true; 
            if (raising > 0) step_Neck =  0.2; 
            xPosition = xPosition + 1/6; 
            yPosition = storeY + 14*Math.sin(deltaJump*Math.PI/130);
            deltaJump = deltaJump + 1;

            if (Math.sin(deltaJump*Math.PI/130 <= 1.2 & deltaJump*Math.PI/130 >= 1.1)) {
                raising = - 0.4;
                step_Tail1 = - 0.3;
                step_Neck = - 0.4;
            }
            if (theta[LEFT_UPPER_FRONT_LEG_ID  ] >= 130){ 
           
                theta[LEFT_UPPER_FRONT_LEG_ID] = theta[LEFT_UPPER_FRONT_LEG_ID] + raising;
                theta[LEFT_LOWER_FRONT_LEG_ID ] = theta[LEFT_LOWER_FRONT_LEG_ID] - 1.5*raising;
                theta[RIGHT_UPPER_FRONT_LEG_ID ] = theta[RIGHT_UPPER_FRONT_LEG_ID] + raising;
                theta[RIGHT_LOWER_FRONT_LEG_ID ] = theta[RIGHT_LOWER_FRONT_LEG_ID] - 1.5*raising;
                theta[LEFT_UPPER_BACK_LEG_ID ] = theta[LEFT_UPPER_BACK_LEG_ID] + raising;
                theta[LEFT_LOWER_BACK_LEG_ID ] = theta[LEFT_LOWER_BACK_LEG_ID] - 1.5*raising;
                theta[RIGHT_UPPER_BACK_LEG_ID ] = theta[RIGHT_UPPER_BACK_LEG_ID] + raising ;
                theta[RIGHT_LOWER_BACK_LEG_ID ] = theta[RIGHT_LOWER_BACK_LEG_ID] - 1.5*raising;
            }



        }
    }

    initNodes(TORSO_ID);
    initNodes(LEFT_UPPER_FRONT_LEG_ID);
    initNodes(RIGHT_UPPER_FRONT_LEG_ID);
    initNodes(LEFT_LOWER_FRONT_LEG_ID);
    initNodes(RIGHT_LOWER_FRONT_LEG_ID);
    initNodes(LEFT_UPPER_BACK_LEG_ID);
    initNodes(RIGHT_UPPER_BACK_LEG_ID);
    initNodes(LEFT_LOWER_BACK_LEG_ID);
    initNodes(RIGHT_LOWER_BACK_LEG_ID);
    initNodes(NECK1_ID);

}
//..............

function buildGround(){

    instanceMatrix = mult(modelViewMatrix, translate(0.0, -LowerFrontLegHeight - 0.1*UpperFrontLegHeight - UpperFrontLegHeight - 0.5, 0.0) );
	instanceMatrix = mult(instanceMatrix, scale4(80, 2.5, 80) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.uniform1f ( gl.getUniformLocation(program, "useTexture"),0.0 )
    colorCube(black);
    for(var i =0; i<6; i++) gl.drawArrays(gl.TRIANGLE_FAN, 4*i, 4);

}

//.............
window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader");

    gl.useProgram( program);

    instanceMatrix = mat4();

    projectionMatrix = ortho(-40.0,40.0,-40.0, 40.0,-40.0,40.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix")

    cube();

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // LOAD THE TEXTURE 
    textureCube()

  
    document.getElementById("startAnimation").onclick = function(event) {
        animateFlag = ! animateFlag;
    };

    for(i=0; i<numNodes; i++) initNodes(i);
    for (i= 0; i<numObstacleNodes; i++) initObstacleNodes(i);
    render();

}
//............

var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT );
        traverse(TORSO_ID);
        traverseObstacle(HorizontalBarId);
        if (animateFlag) animation();
        buildGround();
        requestAnimFrame(render);
}
