<?php

/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package ssa
 */

?>
<!doctype html>
<html <?php language_attributes(); ?>>

<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="profile" href="https://gmpg.org/xfn/11">

  <?php wp_head(); ?>

  <?php
  if (!WP_DEBUG) {
  ?>
    <!-- CODICI ANALYTICS & PIXEL FACEBOOK -->
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <!-- End Global site tag (gtag.js) - Google Analytics -->
    <!-- Facebook Pixel Code -->
    <!-- End Facebook Pixel Code -->
  <?php
  }
  ?>
</head>

<body <?php body_class(); ?>>

  <?php
  // include('layouts/header.php');
  ?>

  <main class="pt-5">