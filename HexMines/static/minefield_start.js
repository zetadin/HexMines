// Copyright Yuriy Khalak, 2025
// Part of HexMines.
// Released under CC BY-NC-SA: https://creativecommons.org/licenses/by-nc-sa/4.0/

var generated = false;
var map_size = 5;
var map = undefined;


function resize_canvas(){
    // resize the minefield_canvas
    const licence_height = getComputedStyle(document.getElementById("license_div")).height.slice(0, -2);
    const minefield_div_size = Math.min(window.innerHeight - licence_height, window.innerWidth)
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
            let mine = new MapFeature(m_x,m_y, "Mine");
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
    } // can now continue

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

    let minefield_div = document.getElementById("minefield_div");
    const licence_height = getComputedStyle(document.getElementById("license_div")).height.slice(0, -2);
    // const license_height = 200;
    // const div_height = getComputedStyle(minefield_div).height.slice(0, -2);
    // console.log(getComputedStyle(minefield_div).getPropertyValue('height'), div_height);

    // show the minefield_div (fade in via opacity)
    minefield_div.style.display="block";
    minefield_div.style.transform = `translate(-50%, -50%) translate(0,${-0.5*licence_height}px)`;
    // console.log(0.5*(div_height), 2*license_height);
    setTimeout(() => {
        minefield_div.style.opacity=1;

        // Show the play_div
        let play_div = document.getElementById("play_div");
        play_div.style.opacity = 1.0;
        play_div.style.pointerEvents = "auto";
        play_div.style.transform = `translate(-50%, -50%) translate(0,${-0.5*licence_height}px)`;
        let play_but = document.getElementById("play_but");
        play_but.disabled = false;
        play_but.style.pointerEvents = "auto";
        play_but.style.cursor = "pointer";
    }, this.animationDelay + 20);

    draw_canvas_grid()

    

    // Add click detection
    let canvas = document.getElementById("minefield_canvas");
    // canvas.addEventListener('click', map.onClick, false);
    canvas.addEventListener('contextmenu', (e) => {e.preventDefault(); map.onRMB(e);}, false);

    // Add hammer.js event listeners instead of the native one for faster response
    var hammertime = new Hammer(canvas);
    hammertime.on('tap', map.onClick);
    // hammertime.on('doubletap', map.onRMB);
    hammertime.on('press', map.onRMB);

}

function play(){
    if(!generated){ // retry after 50 ms
        setTimeout(() => {
            play();
        }, 50);
        return;
    }

    // start lowering the playing field
    map.playing=true;

    // hide the play_div by making it transparent
    let play_div = document.getElementById("play_div");
    play_div.style.opacity = 0.0;
    play_div.style.pointerEvents = "none";
    let play_but = document.getElementById("play_but");
    play_but.disabled = true;
    play_but.style.pointerEvents = "none";
    play_but.style.cursor = "none";
}
