var app = {

  chars: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9'],

  init: function () {
    app.container = document.createElement('div');
    app.container.className = 'animation-container';
    $(".heading").append(app.container)
    window.setInterval(app.add, 100);
  },

  add: function () {
    var element = document.createElement('span');
    app.container.appendChild(element);
    app.animate(element);
  },

  animate: function (element) {
    var character = app.chars[Math.floor(Math.random() * app.chars.length)];
    var duration = Math.floor(Math.random() * 10) + 1;
    var offset = Math.floor(Math.random() * (100 - duration * 2)) + 3;
    var size = 10 + (15 - duration);
    element.style.cssText = 'right:'+offset+'vw; font-size:'+size+'px;animation-duration:'+duration+'s;';
    element.innerHTML = character;
    window.setTimeout(app.remove, duration * 1000, element);
  },

  remove: function (element) {
    element.parentNode.removeChild(element);
  },

};

document.addEventListener('DOMContentLoaded', app.init);

const body = document.body;
const docEl = document.documentElement;

const lineEq = (y2, y1, x2, x1, currentVal) => {
    // y = mx + b
    var m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
    return m * currentVal + b;
};

const lerp = (a,b,n) => (1 - n) * a + n * b;

const distance = (x1,x2,y1,y2) => {
    var a = x1 - x2;
    var b = y1 - y2;
    return Math.hypot(a,b);
};

const getMousePos = (e) => {
    let posx = 0;
    let posy = 0;
    if (!e) e = window.event;
    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY) 	{
        posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    return { x : posx, y : posy }
}

// Window size
let winsize;
const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
calcWinsize();
window.addEventListener('resize', calcWinsize);

// The feDisplacementMap element
const feDisplacementMapEl = document.querySelector('feDisplacementMap');

class Menu {
    constructor() {
        this.DOM = {
            // The SVG element
            svg: document.querySelector('svg.distort'),
            // The menu element
            menu: document.querySelector('nav.menu')
        };
        // The images (one per menu link)
        this.DOM.imgs = [...this.DOM.svg.querySelectorAll('g > image')];
        // The menu links
        this.DOM.menuLinks = [...this.DOM.menu.querySelectorAll('.menu__link')];
        // Mouse position
        this.mousePos = {x: winsize.width/2, y: winsize.height/2};
        // Last mouse positions (one to consider for the image translation movement, another for the scale value of the feDisplacementMap element)
        this.lastMousePos = {
            translation: {x: winsize.width/2, y: winsize.height/2},
            displacement: {x: 0, y: 0}
        };
        // feDisplacementMap scale value
        this.dmScale = 0;
        // Current menu link position
        this.current = -1;

        this.initEvents();
        requestAnimationFrame(() => this.render());
    }
    initEvents() {
        // Update mouse position
        window.addEventListener('mousemove', ev => this.mousePos = getMousePos(ev));

        this.DOM.menuLinks.forEach((item, pos) => {
            // Create spans for each letter
            charming(item);
            const letters = [...item.querySelectorAll('span')];

            const mouseenterFn = () => {
                // Hide the previous menu image.
                if ( this.current !== -1 ) {
                   TweenMax.set(this.DOM.imgs[this.current], {opacity: 0});
                }
                // Update current.
                this.current = pos;

                // Now fade in the new image if we are entering the menu or just set the new image's opacity to 1 if switching between menu items.
                if ( this.fade ) {
                    TweenMax.to(this.DOM.imgs[this.current], 0.5, {ease: Quad.easeOut, opacity: 1});
                    this.fade = false;
                }
                else {
                    TweenMax.set(this.DOM.imgs[this.current], {opacity: 1});
                }

                // Letters effect
                TweenMax.staggerTo(letters, 0.2, {
                    ease: Sine.easeInOut,
                    y: this.lastMousePos.translation.y < this.mousePos.y ? 30 : -30,
                    startAt: {opacity: 1, y: 0},
                    opacity: 0,
                    yoyo: true,
                    yoyoEase: Back.easeOut,
                    repeat: 1,
                    stagger: {
                        grid: [1,letters.length-1],
                        from: 'center',
                        amount: 0.12
                    }
                });
            };
            item.addEventListener('mouseenter', mouseenterFn);
        });

        const mousemenuenterFn = () => this.fade = true;
        const mousemenuleaveFn = () => TweenMax.to(this.DOM.imgs[this.current], .2, {ease: Quad.easeOut, opacity: 0});

        this.DOM.menu.addEventListener('mouseenter', mousemenuenterFn);
        this.DOM.menu.addEventListener('mouseleave', mousemenuleaveFn);
    }
    render() {
        // Translate the image on mousemove
        this.lastMousePos.translation.x = lerp(this.lastMousePos.translation.x, this.mousePos.x, 0.2);
        this.lastMousePos.translation.y = lerp(this.lastMousePos.translation.y, this.mousePos.y, 0.2);
        this.DOM.svg.style.transform = `translateX(${(this.lastMousePos.translation.x-winsize.width/2)}px) translateY(${this.lastMousePos.translation.y-winsize.height*1.5}px)`;

        // Scale goes from 0 to 50 for mouseDistance values between 0 to 140
        this.lastMousePos.displacement.x = lerp(this.lastMousePos.displacement.x, this.mousePos.x, 0.1);
        this.lastMousePos.displacement.y = lerp(this.lastMousePos.displacement.y, this.mousePos.y, 0.1);
        const mouseDistance = distance(this.lastMousePos.displacement.x, this.mousePos.x, this.lastMousePos.displacement.y, this.mousePos.y);
        this.dmScale = Math.min(lineEq(50, 0, 140, 0, mouseDistance), 50);
        feDisplacementMapEl.scale.baseVal = this.dmScale;

        requestAnimationFrame(() => this.render());
    }
}

new Menu();

$(document).ready(function(){

  var $randomnbr = $('.nbr')
  var $timer= 10
  var $it
  var $data = 0
  var index
  var change
  var letters = ["н", "е", "й", "р", "о", "о", "п", "е", "р", "а"]

  $randomnbr.each(function(){

    change = Math.round(Math.random()*100)
    $(this).attr('data-change', change)

  })

  function random(){
    return Math.round(Math.random()*9)
  }

  function select(){
    return Math.round(Math.random()*$randomnbr.length+1)
  }

  function value(){
    $('.nbr:nth-child('+select()+')').html(''+random()+'')
    $('.nbr:nth-child('+select()+')').attr('data-number', $data)
    $data++

    $randomnbr.each(function(){
        if(parseInt($(this).attr('data-number')) > parseInt($(this).attr('data-change'))){
          index = $('.ltr').index(this)
          $(this).html(letters[index])
          $(this).removeClass('nbr')
        }
    })
  }

  $it = setInterval(value, $timer)
})

// $(".menu__link").mouseenter (function() {
//   $("menu__link").css({
//     "color": "black",
//     "transition": "0.4s"
//   })
//   $(".afisha").css({
//     "background-image": "url(images/dido.png)",
//     "background-size": "40%",
//     "background-position": "95% 3%",
//     "background-repeat": "no-repeat",
//     "-webkit-transition": "all" + "1s",
//     "-moz-transition": "all" + "1s",
//     "-o-transition": "all" + "1s",
//     "transition": "all" + "1s"
//   })
//   $(".text-1 p").css({
//     "color": "red",
//     "transition": "0.2s"
//   })
//   $(".event-1 button").css({
//     "display": "block",
//     "float": "right",
//     "margin-right": "79vw",
//     "margin-top": "-3vw"
//   })
// })
