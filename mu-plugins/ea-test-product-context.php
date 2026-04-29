<?php
/**
 * Injects a WooCommerce product context for EA single-product widget test pages.
 *
 * When WordPress loads a page whose slug starts with "ea-single-product-test",
 * this plugin finds the first published product (by SKU prefix "ea-") and sets
 * it as the global $product and $post so that EA's single-product widgets
 * (Price, Rating, Add-to-Cart, Images, Gallery) have a valid product to render.
 *
 * This file is auto-loaded by WordPress as a must-use plugin.
 */

add_action( 'wp', function () {
    if ( ! function_exists( 'wc_get_products' ) ) {
        return;
    }

    $post = get_queried_object();
    if ( ! $post || ! isset( $post->post_name ) ) {
        return;
    }

    if ( strpos( $post->post_name, 'ea-single-product-test' ) !== 0 ) {
        return;
    }

    $products = wc_get_products( [
        'limit'   => 1,
        'status'  => 'publish',
        'orderby' => 'date',
        'order'   => 'ASC',
    ] );

    if ( empty( $products ) ) {
        return;
    }

    $wc_product = $products[0];

    global $product;
    $product = $wc_product;

    global $post;
    $post = get_post( $wc_product->get_id() );
    setup_postdata( $post );
} );
