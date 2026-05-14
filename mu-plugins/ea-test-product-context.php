<?php
/**
 * Renders the Elementor content saved on the EA test product into the
 * WooCommerce single-product page.
 *
 * EA's single-product widgets (Add To Cart, Product Images, Product Price,
 * Product Rating) resolve their product via Helper::get_product(), which
 * internally calls wc_get_product(get_the_ID()). They MUST run while
 * global $post is set to the product post — which is exactly the case on
 * a WC single-product page.
 *
 * The problem: WooCommerce's single-product template never calls the_content(),
 * so Elementor's the_content filter never fires and the _elementor_data saved
 * on the product post is never rendered.
 *
 * Fix: hook into woocommerce_after_single_product_summary with a very low
 * priority and manually invoke Elementor's frontend renderer for the product.
 */

add_action( 'woocommerce_after_single_product_summary', function () {
    global $post;

    if ( ! $post || $post->post_name !== 'ea-widget-test-product' ) {
        return;
    }

    if ( ! class_exists( '\Elementor\Plugin' ) ) {
        return;
    }

    $document = \Elementor\Plugin::$instance->documents->get_doc_for_frontend( $post->ID );
    if ( ! $document ) {
        return;
    }

    $data = $document->get_elements_data();
    if ( empty( $data ) ) {
        return;
    }

    echo '<div class="ea-single-product-test-widgets">';
    $document->print_elements_with_wrapper( $data );
    echo '</div>';
}, 999 );
