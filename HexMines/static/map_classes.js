const sqrtthree = Math.sqrt(3.0);
const hextheta = 2 * Math.PI / 6;

var images = {}

// fmod function from https://gist.github.com/wteuber/6241786
Math.fmod = function (a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); };

// load images assyncroniuosly
async function load_Image(url){
  let ext = url.split('.').pop();
  let img_exts = ["png", "gif"] // allowed image exstensions
  if(img_exts.includes(ext)){
      // load the image
      let img=new Image();
      img.onload=function(){
          // and add it to dict of known images
          images[url]=img;
      };
      img.src=url;
  }
}

// Preload all the MapFeature images
var feature_icons = {
    "Mine": static_path+"/static/mine.png",
    "Boom": static_path+"/static/favico.png",
    "Flag": static_path+"/static/flag.png",
    "None": "",
}
for (const key in feature_icons) {
    load_Image(feature_icons[key]);
}

//////////////////////////////////////////////////////////////////////////////


class Map {
    constructor(height, width, containing_canvas, init=true) {
      this.height = height;
      this.width = width;
      this.hexes = {};
      this.mines = {};
      this.flags = {};
      this.hex_scale = 10;
      this.canvas = containing_canvas;
      this.hex_border_w = 1;
      // where to draw first hex in px
      this.x_start_px = this.hex_scale;               // a
      this.y_start_px_init = 0.5*sqrtthree*this.hex_scale; // h
      this.y_start_px = this.y_start_px_init; // h

      this.playing = false;
      this.v_shift = 0;   // vertical shift in hex_scales
      this.v_speed = 0.0002; // hex_scale/msec, will change with time later

      if(init){ this.init(); }
    }

    init() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                var hex = new Hex(x,y);
                hex.color = "#c0c0c0"; //light grey
                hex.border_w = this.hex_border_w;

                // add this hex to the map
                this.hexes[`${x}_${y}`] = hex;
              }
          }
          
        // this.recalc_scale();
        this.detLine = new DetonationLine(this.hex_scale);
    }

    gen_row(){
      // TODO: generate one more row of mines at the top of the map
    }

    rem_row(){
      // TODO: remove the bottom row of mines at the bottom of the map
    }


    recalc_scale(){
        // horizontally, 1 hex is 2a; 2 hexes are 2a + 1.5a
        let horiz_a = (this.canvas.width-2*this.hex_border_w)/(0.5 + 1.5*this.width);
        // vertically, 1 hex consumes 2h, but two horizontal hexes consume 3h
        // two rows of hexes will then consume 3h + 2h
        let vert_h = (this.canvas.height-2*this.hex_border_w)/(1 + 2*this.height);
        // h = a*sqrt(3)/2
        let vert_a = 2 * vert_h / sqrtthree;

        // calculate scale: smallest of horiontal and vertical a
        this.hex_scale = Math.min(horiz_a, vert_a);

        // shift the start of drawing so it is centered in canvas
        let grid_w = this.hex_scale*(0.5 + 1.5*this.width);
        let grid_h = this.hex_scale*0.5*sqrtthree*(1 + 2*this.width);

        // how much to offset start in px
        let shift_x = 0.5*(this.canvas.width - grid_w);
        let shift_y = 0.5*(this.canvas.height - grid_h);

        this.x_start_px = shift_x + this.hex_scale;               // a
        this.y_start_px_init = shift_y + 0.5*sqrtthree*this.hex_scale; // h
        this.y_start_px = this.y_start_px_init + this.v_shift*this.hex_scale;
    }

    update(dt) {
      // Map itself
      if(this.playing){
        this.v_shift += this.v_speed * dt;
        this.y_start_px = this.y_start_px_init + this.v_shift*this.hex_scale;
      }

      // TODO: logic to remove and generate rows
      this.gen_row();
      this.rem_row();

      // Detonation line
      this.detLine.update(dt);

      // Hexes
      Object.values(this.hexes).forEach((h) => {
          h.update(dt);
      });

      // Features
      Object.values(this.mines).forEach((u) => {
          u.update(dt);
      });
    }
    

    draw(ctx, dt) {
      this.update(dt);

      // Hexes
      Object.values(this.hexes).forEach((h) => {
          h.draw(ctx, this.hex_scale);
      });

      // Features
      Object.values(this.mines).forEach((u) => {
          u.draw(ctx, this.hex_scale);
      });
      Object.values(this.flags).forEach((u) => {
        u.draw(ctx, this.hex_scale);
      });

      this.detLine.draw(ctx, this.hex_scale);
    }

    findHexFromPointerEvent(e) {
      // parse pointer event out of Hammer
      let evt;
      if(typeof e.changedPointers !== 'undefined'){
        evt = e.changedPointers[0];
      }
      else{
        evt = e;
      }

      // skip if haven't started game or game is over
      if(map.playing==false){ return; }
      
      const a = map.hex_scale;
      const h = 0.5*a*sqrtthree;
  
      // start  of the relative axes for click detection
      const rel_start_x = map.x_start_px - a;
      const rel_start_y = a * map.v_shift;
      // read actual borders from canvas
      const style = getComputedStyle(map.canvas);
      const border_left = style.borderLeftWidth.slice(0, -2); // px
      const border_top = style.borderTopWidth.slice(0, -2); // px
      var rect = map.canvas.getBoundingClientRect();
      
  
      const [rel_x, rel_y] = [evt.pageX - rect.left - border_left - rel_start_x,
                              evt.pageY - rect.top - border_top - rel_start_y];
      const tx = Math.floor(rel_x / (1.5*a));
      const remx = Math.fmod(rel_x, (1.5*a));
      const ty = Math.floor((rel_y - (tx%2==1 ? h : 0)) / (2*h)); // move odd columns down by half a hex
      const remy = Math.fmod(rel_y - (tx%2==1 ? h : 0), (2*h));
  
      let [mx, my] = [tx, ty]; // default values that get overwritten if wea re actually in a neighbouring hex
      if(remx<0.5*a){   // if we are left of here, we might be in hexes to the left,
                        // depending which side of edges we are on
          if(remy<h-remx*2*h/a) { // check above /
              mx = tx - 1;
              my = (tx%2==1) ? ty : ty-1; // reduce hex y index if we are in an even column an going left & up.
          }
          else if(remy>h+remx*2*h/a) { // check below \
              mx = tx - 1;
              my = (tx%2==1) ? ty+1 : ty; // increade hex y index if we are in an odd column an going left & down.
          }
      }
      
      // console.log("pointer event @ hex ", mx, my, "\ttemp:", tx, ty, "\tpixels:", evt.pageX, evt.pageY, "\trel:", rel_x, rel_y, "\ta:",a,"\th",h);

      return [mx, my];
    }


    onClick(e){ // LMB down
        // onClick is called as an event listener,
        // so "this" is not the map!
        
        let [mx, my] = map.findHexFromPointerEvent(e);
        let key = `${mx}_${my}`;
        // Toggle reveal of clicked hex
        if(key in map.hexes){
            map.hexes[key].revealed = ! map.hexes[key].revealed;
        }

        // Check for mines in this hex
        if(key in map.mines){
          // Game Over
          map.playing = false;
          map.mines[key].type = "Boom";
          map.mines[key].iconURL = feature_icons["Boom"];
        }

        // TODO: Cascade reveal neighbours

    }

    onRMB(e){ // RMB down / long click / double tap
      // onRMB is called as an event listener,
      // so "this" is not the map!

      let [mx, my] = map.findHexFromPointerEvent(e);
      let key = `${mx}_${my}`;
      
      // Toggle flag on clicked hex
      if(key in map.hexes){
          if(key in map.flags){ // remove flag at this hex
              delete map.flags[key];
          }
          else{ // create a flag at this hex
            let flag = new MapFeature(mx,my, "Flag");
            map.flags[key] = flag;
          }
      }
  }
}



class MapFeature {
  constructor(x,y, type="None") {
    this.x = x;
    this.y = y;
    this.hidden = false;
    this.type = type;
    if(!(type in feature_icons)) { //unrecognized type requested
      console.log("Unknown MapFeature type (", type,") @ ",x,",",y);
    }
    else {
      this.iconURL = feature_icons[type];
    }
  }

  draw(ctx, hex_scale) {
    if(! this.hidden){

      if(this.type == "Mine"){ // skip drawing the mine if it has a flag on it
        let my_key = String(this.x)+"_"+String(this.y);
        if(my_key in map.flags){
          return;
        }
      }

      // only draw if the image is done loading
      if(this.iconURL in images && images[this.iconURL]) {
        const r = hex_scale;
        const s_x = 1.5 * r * (this.x) + map.x_start_px;
        const s_y = sqrtthree*r * (this.y + (this.x%2==1 ? 0.5 : 0.0)) + map.y_start_px;

        let scale = 0.8 * r;
        ctx.drawImage(images[this.iconURL], s_x-scale, s_y-scale, 2*scale, 2*scale);
      }
    }
  }

  update(dt) {
    // TODO: if mine and below Triger line -> detonate
    let s_y = sqrtthree*map.hex_scale * (this.y + (this.x%2==1 ? 0.5 : 0.0)) + map.y_start_px;
    if(s_y > map.detLine.y){
      // Game Over
      map.playing = false;
      this.type = "Boom";
      this.iconURL = feature_icons[this.type];
    }

  }
}


class DetonationLine {
  update(dt) {
    this.y = sqrtthree*map.hex_scale * (map.height - 0.5) + map.y_start_px_init;
  }

  draw(ctx, hex_scale) {
    const r = hex_scale;
    const x = map.x_start_px-r;
    // this.y = sqrtthree*r * (map.height - 0.5) + this.y_start_px_init;

    ctx.strokeStyle = "rgb(255 0 0 / 70%)";
    ctx.lineWidth = 5;
    ctx.beginPath(); // Start a new path
    ctx.moveTo(x, this.y); // Move the pen to start
    ctx.lineTo(x+1.5 * r * map.width + 0.5*r, this.y); // Draw a line to end
    ctx.stroke(); // Render the path
  }
}


var number_colors=[
  "#000000", // 0
  "#303030", // 1
  "#0b6623", // 2
  "#4682b4", // 3
  "#4b0082", // 4
  "#d67229", // 5
  "#ff3030", // 6
]

var hex_color=["#707070", "#F0F0F0"]


class Hex {
    constructor(x,y) {
      this.x = x;
      this.y = y;
      // this.color = "#FAFAFA";
      this.revealed = false;
      this.border_w = 1;
      this.border_color = "#000000"; //"#A0A0A0"
      this.num_neigh_mines=-1;

      // find each Hex's neighbours
      this.neighbour_dict = [];

      // N
      let next_key = String(x)+"_"+String(y-1);
      this.neighbour_dict["N"] = next_key;

      // NE
      next_key = String(x+1)+"_"+String(y+(x%2==0 ? -1 : 0));
      this.neighbour_dict["NE"] = next_key;

      // SE
      next_key = String(x+1)+"_"+String(y+(x%2==0 ? 0 : 1));
      this.neighbour_dict["SE"] = next_key;

      // S
      next_key = String(x)+"_"+String(y+1);
      this.neighbour_dict["S"] = next_key;

      // SW
      next_key = String(x-1)+"_"+String(y+(x%2==0 ? 0 : 1));
      this.neighbour_dict["SW"] = next_key;

      // NW
      next_key = String(x-1)+"_"+String(y+(x%2==0 ? -1 : 0));
      this.neighbour_dict["NW"] = next_key;
    }

    calc_neigh_mines(mines){
        // calculate hex's num_neigh_mines
        this.num_neigh_mines = 0;
        
        let my_key = String(this.x)+"_"+String(this.y);
        if(mines[my_key]){
            this.num_neigh_mines = 0;
        }
        else{
          // no mine here
          for (const key in this.neighbour_dict) {
              // console.log(key, this.neighbour_dict[key], mines[this.neighbour_dict[key]]);
              if(mines[this.neighbour_dict[key]]){
                  this.num_neigh_mines += 1;
              }
          }
        }
    }

    update(dt){
      if(this.num_neigh_mines<0 && generated){
        this.calc_neigh_mines(map.mines);
      }
    }

    draw(ctx, hex_scale) {
      const r = hex_scale;
      const s_x = 1.5 * r * (this.x) + map.x_start_px;
      const s_y = sqrtthree*r * (this.y + (this.x%2==1 ? 0.5 : 0.0)) + map.y_start_px;
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
          ctx.lineTo(s_x + r * Math.cos(hextheta * i), s_y + r * Math.sin(hextheta * i));
      }
      ctx.closePath();
      ctx.fillStyle = hex_color[this.revealed | 0];
      ctx.fill();
      ctx.strokeStyle = this.border_color;
      ctx.lineWidth = this.border_w;
      ctx.stroke();

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = 'middle';
      ctx.font = "12px sans";
      ctx.fillText(`${this.x},${this.y}`, s_x, s_y+hex_scale*0.75);

      if(this.num_neigh_mines>0){
        ctx.font = `${Math.round(hex_scale*1.4)}px Verdana`;
        // ctx.fillStyle = "#303030";
        ctx.fillStyle = number_colors[this.num_neigh_mines];
        ctx.fillText(`${this.num_neigh_mines}`, s_x, s_y);
      }
    }    
}



/////////////////////////////////////////////////////////
////////////////Rendering Loop///////////////////////////
/////////////////////////////////////////////////////////

var FPS_counter=0;
var FPS_text="FPS: ?";
var lastFPSReset = Date.now();
var lastUpdate = Date.now();

function update(){
  // find time between updates
  var frameStart = Date.now();
  var dt = frameStart - lastUpdate;
  lastUpdate = frameStart;

  // get context
  let canvas = document.getElementById("minefield_canvas");
  var ctx = canvas.getContext('2d');

  // clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw map
  map.draw(ctx, dt);

  // calculate FPS readout, averaged over 500ms
  FPS_counter++;
  var now = Date.now();
  if(lastFPSReset+500 <= now){
      let fps = FPS_counter*1000.0/(now - lastFPSReset);
      FPS_text=`FPS: ${Math.round(fps)}`;
      FPS_counter = 0;
      lastFPSReset = now;
  }
  
  // draw FPS readout
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.font = "20px sans";
  ctx.textAlign = "end";
  ctx.textBaseline = 'top';
  ctx.strokeText(FPS_text, canvas.width-1, 0);

  // schedule the next update at next frame redraw.
  // operates at screen refresh rate with no throttling.
  // not technically recursive, just a one-time callback not on stack.

  requestAnimationFrame(update);
}
