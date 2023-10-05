
var generated = false;
var map_size = 5;
var map = undefined;


function resize_canvas(){
    // resize the minefield_canvas
    const minefield_div_size = Math.min(window.innerHeight, window.innerWidth)
    let minefield_div = document.getElementById("minefield_div");
    style = window.getComputedStyle(minefield_div);
    let side_extra = 2*parseFloat(style['borderWidth']) + parseFloat(style['padding']) //want some white space around border
    let canvas = document.getElementById("minefield_canvas");
    style = window.getComputedStyle(canvas);
    side_extra += parseFloat(style['borderWidth']);
    const canvas_size = Math.floor(minefield_div_size - 2.0*side_extra )
    canvas.height = canvas_size
    canvas.width = canvas_size

    if(typeof map !== 'undefined'){
        map.recalc_scale();
        if(generated){
            draw_canvas_grid(); // redraw canvas, because resizing wipes it
        }
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
    let canvas = document.getElementById("minefield_canvas");
    let ctx = canvas.getContext('2d');

    // draw map
    map.draw(ctx);

    // // draw debug text
    // ctx.font = "16px serif";
    // ctx.strokeText("Debug text", 8, 16+1);
    
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

    // register listener to draw the canvas after fade in
    minefield_div.addEventListener("transitionend", () => {
        draw_canvas_grid();
      });

    // show the minefield_div (fade in via opacity)
    minefield_div.style.display="block";
    setTimeout(() => {
        minefield_div.style.opacity=1;
    }, this.animationDelay + 20);


    
}
