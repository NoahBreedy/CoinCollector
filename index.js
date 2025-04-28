//Set Up express and create an Instance
const express = require('express');
const app = express();
const TeenyAT = require('./teenyAT.js');

//Create http server and automatically listen in on any open port
const serv = require('http').Server(app);
serv.listen(3000)
console.log(`Listening on http://localhost:3000/client/`);


//Let our express app use the html files held in our client folder
app.use('/client',express.static(__dirname + '/client'));
const socket = require('socket.io');
const io = socket(serv);

//Send out index.html file when a user requests the main route
app.get('/', (req,res)=>{
  res.sendFile(__dirname + "/client/index.html");
});


/* TeenyAT system code */
const DEBUG = 0x9000;
const MOVE = 0xE000;
const ROTATE_LEFT = 0xE001;
const ROTATE_RIGHT = 0xE002
const PLAYER_X = 0xA000;
const PLAYER_Y = 0xA001;
const PLAYER_DIRECTION = 0xA002;
const NEAREST_COIN = 0xA003;
const NEAREST_COIN_X = 0xA004;
const NEAREST_COIN_Y = 0xA005;
const NEAREST_ENEMY = 0xA006;
const NEAREST_ENEMY_X = 0xA007;
const NEAREST_ENEMY_Y = 0xA008;
const COIN_COUNT = 0xA009;
const RANDOM = 0xA00A;


let PLAYER_DATA = {};
let TEENYATS = {};
let MAP_DATA = [];
let COINS_IN_GAME = 0;
let MAX_COINS_IN_GAME = 20;

/**
 *   Function to move a single player forward in the direction they are facing 
 **/
function moveForward(obj){

      MAP_DATA[obj.x][obj.y] = 0;
      let move_dir_x = obj.x;
      let move_dir_y = obj.y;

      if(obj.dir == 0){
          obj.y = Math.abs(obj.y + 1) % 14;
          move_dir_y = Math.abs(obj.y + 3) % 14;
      }else if(obj.dir == 2){
        let oldy = obj.y;
        obj.y = (obj.y - 1) % 14;
        if(oldy - 1 < 0){
          obj.y = 13;
        }
        move_dir_y = Math.abs(obj.y - 3) % 14;
      }else if(obj.dir == 1){
        let oldx = obj.x;
        obj.x =  obj.x - 1 % 14;
        if(oldx - 1 < 0){
          obj.x = 13;
        }
        move_dir_x = Math.abs(obj.x - 3) % 14;
      }else if(obj.dir == 3){
        obj.x = Math.abs(obj.x + 1) % 14;
        move_dir_x = Math.abs(obj.x + 3) % 14;
      }
      
      /* coin collissions */
      if(MAP_DATA[obj.x][obj.y] == 1){
          obj.coin_count++;
          COINS_IN_GAME--;
          MAP_DATA[obj.x][obj.y] = 0;
      }

      /* player collissions */
      if(MAP_DATA[obj.x][obj.y] != 0){
         id = MAP_DATA[obj.x][obj.y];
         moveHitPlayer(id,move_dir_x,move_dir_y);
      }

    MAP_DATA[obj.x][obj.y] = obj.id;
}

/**
 *   Bounce hit player in the direction of the instance player
 **/
function moveHitPlayer(id,dir_x,dir_y){
    if(TEENYATS[id].extra_data.coin_count > 0){
        TEENYATS[id].extra_data.coin_count--;
        if(TEENYATS[id].extra_data.coin_count < 0) TEENYATS[id].extra_data.coin_count = 0;
    }
    TEENYATS[id].extra_data.x = dir_x;
    TEENYATS[id].extra_data.y = dir_y;
    MAP_DATA[dir_x][dir_y] = id;
}

function getNearestCoin(array,x,y){
   let minDistance = Infinity;
   let nearestRow = -1, nearestCol = -1;
   for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[0].length; j++) {
            if (array[i][j] === 1) {
                distance = Math.abs(x - i) + Math.abs(y - j);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestRow = i;
                    nearestCol = j;
                }
            }
        }
    }
    if(!Number.isFinite(minDistance)) minDistance = -1;
    return { x: nearestRow, y: nearestCol, dist: minDistance };
}

function getNearestEnemy(array,x,y,my_id){
  let minDistance = Infinity;
  let nearestRow = -1, nearestCol = -1;
  for (let i = 0; i < array.length; i++) {
       for (let j = 0; j < array[0].length; j++) {
           if (typeof array[i][j] == 'string' && array[i][j] != my_id) {
               distance = Math.abs(x - i) + Math.abs(y - j);
               if (distance < minDistance) {
                   minDistance = distance;
                   nearestRow = i;
                   nearestCol = j;
               }
           }
       }
   }
   if(!Number.isFinite(minDistance)) minDistance = -1;
   return { x: nearestRow, y: nearestCol, dist: minDistance };
}

/**
 *   Constructor function to hold player information 
 **/
function Player(x,y,dir,id){
      this.x = x;
      this.y = y;
      this.dir = dir;
      this.id = id;
      this.nearest_coin_x = -1;
      this.nearest_coin_y = -1;
      this.nearest_enemy_x = -1;
      this.nearest_enemy_y = -1;
      this.coin_count = 0;
}

/* Init coins */
for(var i  = 0; i < 14; ++i){
  MAP_DATA[i] = new Array(14);
  for(var j  = 0; j < 14; ++j){
      MAP_DATA[i][j] = 0;
      if(i == 5 && j == 5){
        MAP_DATA[i][j] = 1;
        COINS_IN_GAME++;
      }
  }
}

/* Update all teenyAT instances */
setInterval( () => {
  // each data is an instance of the teenyAT
  for([key, data] of Object.entries(TEENYATS)){
      if(data.initialized){
          for(var i = 0; i < 2; i++){
            data.tny_clock();
          }
      }
  }
  io.sockets.in("main").emit('player_tick', PLAYER_DATA);
  io.sockets.in("main").emit('map_tick', MAP_DATA);
},100);

/* Generate New Coins */
setInterval(()=>{
  let rand = Math.floor(Math.random() * (14));
  let rand_x = Math.floor(Math.random() * (14));
  let rand_y = Math.floor(Math.random() * (14));
  if(rand % 2 == 0 && COINS_IN_GAME < MAX_COINS_IN_GAME){
    if(MAP_DATA[rand_x][rand_y] == 0){
      MAP_DATA[rand_x][rand_y] = 1;
      COINS_IN_GAME++;
    } 
  }
  io.sockets.in("main").emit('map_tick', MAP_DATA);
},2000);


io.sockets.on('connection', function(socket) {

  //Print the succesful connection
  console.log("New Connection: " + socket.id);
  socket.join("main");
  io.to(socket.id).emit('getID',socket.id);
 
  socket.on('disconnect', () => {
     delete PLAYER_DATA[socket.id];
     if(socket.io in TEENYATS){
        delete TEENYATS[socket.io];
     }
  }).on('send_binary',(data)=>{
      if(!(socket.id in TEENYATS)){
         PLAYER_DATA[socket.id] = new Player(0,0,0,socket.id);
      }
      TEENYATS[socket.id] = new TeenyAT();
      TEENYATS[socket.id].extra_data = PLAYER_DATA[socket.id];
      TEENYATS[socket.id].tny_init_from_file(data,bus_read,bus_write);
  }).on("stop_robot",()=>{
    if((socket.id in TEENYATS)){
       TEENYATS[socket.id].initialized = false;
    }
  });

});

function bus_read(t,addr){
  let result = null;
  //console.log(`Bus Read: ${addr}`);
  result = {data:0,delay:0}
  switch(addr){
    case PLAYER_DIRECTION:
      result.data = t.extra_data.dir;
      break;
    case NEAREST_COIN:
        var nearest_coin = getNearestCoin(MAP_DATA,t.extra_data.x,t.extra_data.y);
        t.extra_data.nearest_coin_x = nearest_coin.x;
        t.extra_data.nearest_coin_y = nearest_coin.y;
        result.data = nearest.dist;
        break;
    case NEAREST_COIN_X:
          var nearest_coin = getNearestCoin(MAP_DATA,t.extra_data.x,t.extra_data.y);
          t.extra_data.nearest_coin_x = nearest_coin.x;
          result.data = t.extra_data.nearest_coin_x;
          break;
    case NEAREST_COIN_Y:
          var nearest_coin = getNearestCoin(MAP_DATA,t.extra_data.x,t.extra_data.y);
          t.extra_data.nearest_coin_y = nearest_coin.y;
          result.data = t.extra_data.nearest_coin_y;
          break;
    case NEAREST_ENEMY:
            var nearest_enemy = getNearestEnemy(MAP_DATA,t.extra_data.x,t.extra_data.y,t.extra_data.id);
            // console.log(nearest_enemy)
            t.extra_data.nearest_enemy_x = nearest_enemy.x;
            t.extra_data.nearest_enemy_y = nearest_enemy.y;
            result.data = nearest_enemy.dist;
            break;
    case NEAREST_ENEMY_X:
              var nearest_enemy = getNearestEnemy(MAP_DATA,t.extra_data.x,t.extra_data.y,t.extra_data.id);
              t.extra_data.nearest_enemy_x = nearest_enemy.x;
              result.data = t.extra_data.nearest_enemy_x;
              break;
    case NEAREST_ENEMY_Y:
            var nearest_enemy = getNearestEnemy(MAP_DATA,t.extra_data.x,t.extra_data.y,t.extra_data.id);
            t.extra_data.nearest_enemy_y = nearest_enemy.y;
            result.data = t.extra_data.nearest_enemy_y;
            break;
    case COIN_COUNT:
            result.data = t.extra_data.coin_count;
            break;
    case PLAYER_X:
            result.data = t.extra_data.x;
            break;
    case PLAYER_Y:
            result.data = t.extra_data.y;
            break;
    case RANDOM:
           result.data = Math.floor(Math.random() * (0xFFFF));
           break;
    default:
        console.log(`Unhandled read address ${addr}`);
  }
  return result;
}

function bus_write(t,addr,data){
  let result = null;
  //console.log(`Bus Write: ${addr}`);
  switch(addr){
    case DEBUG:
      console.log(`VALUE IS: ${data}`);
      break;
    case MOVE:
        moveForward(t.extra_data);
        break;
    case ROTATE_LEFT:
          t.extra_data.dir = (t.extra_data.dir + 1) % 4;
          break;
    case ROTATE_RIGHT:
          let tmp = t.extra_data.dir - 1;
          if(tmp < 0){
            t.extra_data.dir = 3;
            break;
          }
          t.extra_data.dir = (t.extra_data.dir - 1) % 4;
          break;
    case PLAYER_DIRECTION:
         t.extra_data.dir = Math.abs(data % 4);
         break;
    default:
        console.log(`Unhandled write address ${addr}`);
  }
  result = {delay:0}
  return result;
}