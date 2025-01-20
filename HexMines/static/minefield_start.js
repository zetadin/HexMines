
var generated = false;
var map_size = 5;
var map = undefined;


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

// load images assyncroniuosly
var mineURL = static_path+"/static/mine.png";
var flagURL = static_path+"/static/flag.png";
load_Image(mineURL);
load_Image(flagURL);


function resize_canvas(){
    // resize the minefield_canvas
    const minefield_div_size = Math.min(window.innerHeight, window.innerWidth)
    let minefield_div = document.getElementById("minefield_div");
    style = window.getComputedStyle(minefield_div);
    let side_extra = 2*parseFloat(style['borderWidth']) + parseFloat(style['padding']) // want some white space around border
    let canvas = document.getElementById("minefield_canvas");
    style = window.getComputedStyle(canvas);
    side_extra += parseFloat(style['borderWidth']);
    const canvas_size = Math.floor(minefield_div_size - 2.0*side_extra )
    canvas.height = canvas_size
    canvas.width = canvas_size

    if(typeof map !== 'undefined'){
        map.recalc_scale();
    }
    else{ // retry scaling after map is instantiated
        setTimeout(() => {
            resize_canvas();
        }, 10);
    }
}

// register listener on window size change
window.addEventListener('resize', (event) => {resize_canvas()}, true);




async function generate(field_size) {
    map_size = field_size
    map = new Map(map_size, map_size, document.getElementById("minefield_canvas"));

    let max_mines = Math.floor(0.2*map_size*map_size);
    let n_mines = 0;
    while (n_mines < max_mines) {
        let m_x = Math.floor(Math.random() * map.width);
        let m_y = Math.floor(Math.random() * map.height/2);

        let key = `${m_x}_${m_y}`;
        if(! (key in map.mines)){ // only add a mine if hex already doesn't have one
            let mine = new MapFeature(m_x,m_y, mineURL);
            map.mines[key] = mine;

            n_mines += 1;
        }
    }

    // after done generating, set a flag to allow canvas drawing
    generated = true;
}

function draw_canvas_grid(){
    if(!generated){ // retry after 50 ms
        setTimeout(() => {
            draw_canvas_grid();
        }, 50);
        return;
    }
    // can continue

    // draw map
    update();
}

function strt(field_size) {

    // Disable start buttons
    let strt_buttons = document.getElementsByClassName("button_start");
    for (let i = 0; i < strt_buttons.length; i++) {
        strt_buttons[i].style.background='#a7a7a7';
        strt_buttons[i].style.color='#000000';
        strt_buttons[i].disabled = true;
      }

    // start generating the minefield (async)
    generate(field_size);

    // hide the start_div by sliding it out of screen
    let start_div = document.getElementById("start_div");
    let style = window.getComputedStyle(start_div);
    let shift = parseInt(style['marginTop']) + start_div.offsetHeight;
    // register listener to disable showing start_div after it is off-screen
    start_div.addEventListener("transitionend", () => {
        start_div.style.display="none"
      });
    start_div.style.transform = `translate(-50%, ${-shift}px)`;
        
    

    // resize the minefield_canvas
    resize_canvas()

    // show the minefield_div (fade in via opacity)
    minefield_div.style.display="block";
    setTimeout(() => {
        minefield_div.style.opacity=1;
    }, this.animationDelay + 20);

    draw_canvas_grid()

    
}
