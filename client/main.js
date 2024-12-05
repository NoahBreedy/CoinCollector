const socket = io();

let player_data = {};
let map = null;
let my_id = "";
let image_loaded_count = 0;
let frameCount = 0;
let coin_anim = 0;
let initted = false;
let start_stop = false;

socket.on('player_tick',(_data)=>{
   player_data = _data;
}).on('getID',(_id)=>{
    my_id = _id;
}).on('map_tick',(_data)=>{
    map = _data;
});

function send_to_server(){
    let button = document.getElementById("input-button");
    start_stop = !start_stop;
    if(start_stop){
        button.style.backgroundColor = "#fc0313";
        button.innerText = "Stop Robot";
        let text = document.getElementById("asm-text").value;
        socket.emit("send_binary",assemble(text));
        return;
    }
    button.style.backgroundColor = "#405cf5";
    button.innerText = "Send To Robot";
    socket.emit("stop_robot");
}

window.onload = () =>{

    let c = document.getElementById("myCanvas"),
    ctx = c.getContext("2d"),
    width = c.width = window.innerWidth,
    height = c.height = window.innerHeight,
    tileWidth = 60,
    tileHeight = 30;


    ctx.translate(width/2,150);

    var img = document.createElement("img");
    var player_img = document.createElement("img");
    var coin_img = document.createElement("img");

    img.src = "tileSheet.png";
    player_img.src = "player.png";
    coin_img.src = "coin.png";
    
    img.addEventListener("load",()=>{
        image_loaded_count++;
        if(image_loaded_count >= 3){
            initted = true;
            draw();
        }
    });

    player_img.addEventListener("load",()=>{
        image_loaded_count++;
        if(image_loaded_count >= 3){
            initted = true;
            draw();
        }
    });

    coin_img.addEventListener("load",()=>{
        image_loaded_count++;
        if(image_loaded_count >= 3){
            initted = true;
            draw();
        }
    });
    
    function draw(){
        ctx.beginPath(); // Start a new path
        ctx.clearRect(-width, -height, width*2, height*2); // Add a rectangle to the current path
        ctx.fill(); // Render the path

        for(var i=0;i<14;++i){
            for(var j =0;j<14;++j){
                drawImageTile(i,j,5);
            }
        }

        for([key, data] of Object.entries(player_data)) {
            let self = 6;
            let p = data;
            if(key == my_id){
                self = 10;
                document.getElementById("coin").innerHTML = `Your Coins: ${data.coin_count}`
            } 
            
            drawPlayerTile(p.x,p.y,p.dir,self);
        }

        if(map){
            for(var x = 0; x < 14; ++x){
                for(var y = 0; y < 14; y++){
                        if(map[x][y] == 1) drawCoinTile(x,y,coin_anim);
                }
            }
        }
    }

    function update(){
       requestAnimationFrame(update);
       if(initted){
            frameCount = (frameCount+1) % 60;   
            if(frameCount % 15 == 0){
                coin_anim = (coin_anim + 1) % 5;
                if(coin_anim == 0) coin_anim = 1;
            }
            draw();
       }
     }update();


    function drawImageTile(x,y,index){
        ctx.save();
        ctx.translate((x-y)*(tileWidth/2),(x+y)*(tileHeight/2) + (index<4 ? 5 : 0));

        ctx.drawImage(img,index * tileWidth,0,tileWidth,img.height,
            -tileWidth/2,0,tileWidth,img.height);


        ctx.restore();
    }

    function drawPlayerTile(x,y,dir,player){
        // up = (7,10)
        // down = (3,10)
        // left = (5,10)
        // right = (1,10)

        if(dir == 0) dir = 5;
        else if(dir == 2) dir = 1;
        else if(dir == 1) dir = 7;
        else if(dir == 3) dir = 3;

        let player_width = 16;
        let player_height = 24;
        ctx.save();
       
        ctx.translate((x-y)*(tileWidth/2)-(player_width/2),(x+y)*(tileHeight/2)-(player_height/2));

        ctx.drawImage(player_img,(dir*player_width),((player*player_height)),player_width,player_height,
                                 0,0, player_width*2, player_height*2);


        ctx.restore();
    }

    function drawCoinTile(x,y,anim_frame){
      
        let coin_width = 16;
        let coin_height = 16;
        ctx.save();
       
        ctx.translate((x-y)*(tileWidth/2)-(coin_width/2),(x+y)*(tileHeight/2)-(coin_height/2));

        ctx.drawImage(coin_img,anim_frame*coin_width,0,coin_width,coin_height,
                                 0,0, coin_width*2, coin_height*2);


        ctx.restore();
    }

}