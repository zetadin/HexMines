const sqrtthree = Math.sqrt(3.0);
const hextheta = 2 * Math.PI / 6;

var images = {}


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
      this.y_start_px = 0.5*sqrtthree*this.hex_scale; // h
      if(init){ this.init(); }
    }

    init() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                var hex = new Hex(x,y);
                hex.color = "#c0c0c0"; //light grey
                hex.border_w = this.hex_border_w;
                this.hexes[`${x}_${y}`] = hex;
              }
          }

        //TODO: find each Hex's neighbours

        //TODO: calculate num_neigh_mines
          
        // this.recalc_scale();
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
        this.y_start_px = shift_y + 0.5*sqrtthree*this.hex_scale; // h
    }

    draw(ctx) {
      Object.values(this.hexes).forEach((h) => {
          h.draw(ctx, this.hex_scale);
      });

      Object.values(this.mines).forEach((u) => {
          u.draw(ctx, this.hex_scale);
      });
    }
}


class MapFeature {
  constructor(x,y, icon="") {
    this.x = y;
    this.y = x;
    this.iconURL = icon;
    this.hidden = false;
  }

  draw(ctx, hex_scale) {
    if(! this.hidden){
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
}

class Hex {
    constructor(x,y) {
      this.x = y;
      this.y = x;
      this.color = "#FAFAFA";
      this.border_w = 1;
      this.border_color = "#000000"; //"#A0A0A0"
      this.num_neigh_mines=0;
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
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = this.border_color;
      ctx.lineWidth = this.border_w;
      ctx.stroke();

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.font = "12px sans";
      ctx.fillText(`${this.x},${this.y}`, s_x, s_y+hex_scale*0.75);

      if(this.num_neigh_mines>0){
        ctx.font = "28px sans";
        ctx.fillStyle = "#303030";
        ctx.fillText(`${this.neighbours}`, s_x, s_y);
      }

      
    }    
}
