window.$ = require('jquery');
import 'bootstrap';
import AOS from 'aos';

$( document ).ready(function() {
  console.log('ok')

  $('h1').addClass('demo')
  AOS.init()

  // require('./import/sticky')
  
});
