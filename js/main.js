import $ from './../node_modules/jquery/dist/jquery.min.js';
import 'bootstrap';
import AOS from './../node_modules/aos/dist/aos.js';

$( document ).ready(function() {
  console.log('ok')

  $('h1').addClass('demo')
  AOS.init()

});