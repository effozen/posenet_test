// posenet.js
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
let status = 1;
let poseData;


//webcam을 enable하는 코드
navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(function (stream) {
    video.srcObject = stream;
});

//then 안쪽이 function(model){} 이렇게 쓰는거랑 같다 (인자가 하나라 중괄호가 없는 것)
posenet.load().then((model) => {
    // 이곳의 model과 아래 predict의 model은 같아야 한다.
    video.onloadeddata = (e) => {
        programControl();
        //비디오가 load된 다음에 predict하도록. (안하면 콘솔에 에러뜸)
        predict();
    };

    function predict() {
        //frame이 들어올 때마다 estimate를 해야하니 함수화 시킴
        model.estimateSinglePose(video).then((pose) => {
            canvas.width = video.width; //캔버스와 비디오의 크기를 일치시킴
            canvas.height = video.height;
            // console.log("pose");
            // console.log(pose);
            // console.log(typeof(pose));
            drawKeypoints(pose.keypoints, 0.6, context); //정확도
            drawSkeleton(pose.keypoints, 0.6, context);
            //poseData +=
            //console.log(JSON.stringify(pose.keypoints));
            poseData += JSON.stringify(pose);
            poseData += ";";
            // pose가 동작에 대한 OutPut이다.
        });
        if (status == 1) {
            requestAnimationFrame(predict); //frame이 들어올 때마다 재귀호출
        } else {
            console.log(poseData);
            data=poseData;
            //saveAsFile(poseData, "test.txt");
        }
    }
});
/* PoseNet을 쓰면서 사용하는 함수들 코드 - 그냥 복사해서 쓰기*/

//tensorflow에서 제공하는 js 파트
const color = "aqua";
const boundingBoxColor = "red";
const lineWidth = 2;

function toTuple({y, x}) {
    return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
        drawSegment(toTuple(keypoints[0].position), toTuple(keypoints[1].position), color, scale, ctx);
    });
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];

        if (keypoint.score < minConfidence) {
            continue;
        }

        const {y, x} = keypoint.position;
        drawPoint(ctx, y * scale, x * scale, 3, color);
    }
}

function drawBoundingBox(keypoints, ctx) {
    const boundingBox = posenet.getBoundingBox(keypoints);

    ctx.rect(
        boundingBox.minX,
        boundingBox.minY,
        boundingBox.maxX - boundingBox.minX,
        boundingBox.maxY - boundingBox.minY
    );

    ctx.strokeStyle = boundingBoxColor;
    ctx.stroke();
}

// Start / Pause를 구현하기 위한 코드.
function programControl() {
    startButton.addEventListener("click", function () {
        status = 1;
        //console.log("start");
    })
    pauseButton.addEventListener("click", function () {
        status = 0;
        //console.log("stop");
    })
}

// 데이터로 저장하기 위한 함수
function saveAsFile(str, filename) {
    let hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(str);
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
}