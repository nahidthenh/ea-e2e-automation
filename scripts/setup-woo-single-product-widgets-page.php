<?php
/**
 * Test page: WooCommerce Single Product Widgets
 *
 * Creates (or finds) a dedicated WC test product and saves Elementor widget
 * data on it with multiple instances of all four single-product widgets:
 *   eael-woo-add-to-cart, eael-woo-product-images,
 *   eael-woo-product-price, eael-woo-product-rating
 *
 * All four widgets resolve product context from the global $post, so the
 * product's own permalink (/product/{slug}/) acts as the test page URL.
 *
 * Run via: wp eval-file /scripts/setup-woo-single-product-widgets-page.php
 */

if ( ! class_exists( 'WooCommerce' ) ) {
    WP_CLI::error( 'WooCommerce is not active — cannot seed single-product widgets.' );
}

require_once __DIR__ . '/helpers-sample-data.php';

// ── Shared helpers ─────────────────────────────────────────────────────────

if ( ! function_exists( 'ea_make_id' ) ) {
    function ea_make_id(): string {
        return substr( md5( uniqid( '', true ) ), 0, 8 );
    }
}
if ( ! function_exists( 'ea_widget' ) ) {
    function ea_widget( string $css_class, string $widget_type, array $settings ): array {
        return [
            'id' => ea_make_id(), 'elType' => 'widget', 'widgetType' => $widget_type,
            'settings' => array_merge( [ '_css_classes' => $css_class ], $settings ),
            'elements' => [],
        ];
    }
}
if ( ! function_exists( 'ea_heading' ) ) {
    function ea_heading( string $title, string $tag = 'h4' ): array {
        return [
            'id' => ea_make_id(), 'elType' => 'widget', 'widgetType' => 'heading',
            'settings' => [ 'title' => $title, 'header_size' => $tag ],
            'elements' => [],
        ];
    }
}
if ( ! function_exists( 'ea_build_elementor_data' ) ) {
    function ea_build_elementor_data( array $widgets ): array {
        return [ [
            'id' => ea_make_id(), 'elType' => 'section', 'isInner' => false,
            'settings' => [], 'elements' => [ [
                'id' => ea_make_id(), 'elType' => 'column', 'isInner' => false,
                'settings' => [ '_column_size' => 100 ], 'elements' => $widgets,
            ] ],
        ] ];
    }
}
if ( ! function_exists( 'ea_save_elementor_data' ) ) {
    function ea_save_elementor_data( int $page_id, array $widgets ): void {
        $data = ea_build_elementor_data( $widgets );
        update_post_meta( $page_id, '_elementor_data', wp_json_encode( $data ) );
        update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
        update_post_meta( $page_id, '_elementor_version', '3.0.0' );
        delete_post_meta( $page_id, '_elementor_css' );
    }
}

// ── WC-specific helpers ────────────────────────────────────────────────────

function ea_upsert_wc_product( string $sku, string $name, string $regular, string $sale, string $hex ): int {
    $existing_id = wc_get_product_id_by_sku( $sku );
    if ( $existing_id ) {
        WP_CLI::log( "  exists : {$name} (SKU: {$sku}, ID: {$existing_id})" );
        return (int) $existing_id;
    }

    $product = new WC_Product_Simple();
    $product->set_name( $name );
    $product->set_slug( $sku );
    $product->set_sku( $sku );
    $product->set_regular_price( $regular );
    $product->set_sale_price( $sale );
    $product->set_status( 'publish' );
    $product->set_catalog_visibility( 'visible' );
    $product->set_reviews_allowed( true );
    $product->set_stock_status( 'instock' );

    $id = $product->save();

    $img_id = ea_create_placeholder_image( $name, $hex );
    if ( $img_id ) {
        set_post_thumbnail( $id, $img_id );
    }

    WP_CLI::log( "  created: {$name} (SKU: {$sku}, ID: {$id})" );
    return (int) $id;
}

function ea_ensure_product_review( int $product_id, int $rating = 4 ): void {
    $existing = get_comments( [
        'post_id' => $product_id,
        'type'    => 'review',
        'number'  => 1,
        'status'  => 'approve',
    ] );

    if ( ! empty( $existing ) ) {
        WP_CLI::log( '  review : already exists, skipping.' );
        return;
    }

    $comment_id = wp_insert_comment( [
        'comment_post_ID'      => $product_id,
        'comment_author'       => 'EA Tester',
        'comment_author_email' => 'tester@example.com',
        'comment_content'      => 'Excellent product for EA widget testing!',
        'comment_type'         => 'review',
        'comment_approved'     => 1,
    ] );

    if ( $comment_id ) {
        add_comment_meta( $comment_id, 'rating', $rating );
        if ( class_exists( 'WC_Comments' ) ) {
            WC_Comments::clear_transients( $product_id );
        }
        WP_CLI::log( "  review : created (rating {$rating}/5, comment ID {$comment_id})" );
    } else {
        WP_CLI::warning( '  review : failed to insert review comment.' );
    }
}

// ── Create / find test product ─────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- WooCommerce Single Product Widgets page ---' );

$sku        = getenv( 'WOO_SINGLE_PRODUCT_SKU' ) ?: 'ea-widget-test-product';
$product_id = ea_upsert_wc_product(
    $sku,
    'EA Widget Test Product',
    '99.99',
    '59.99',
    '#8e44ad'
);

ea_ensure_product_review( $product_id, 4 );

// ── Build widget instances ─────────────────────────────────────────────────

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Woo Add To Cart
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Woo Add To Cart ──', 'h2' ),

    ea_heading( 'Add To Cart | Default (Row layout, qty on, icon on)' ),
    ea_widget( 'test-watc-default', 'eael-woo-add-to-cart', [
        'add_to_cart_layout'        => 'row',
        'add_to_cart_show_quantity' => 'yes',
        'add_to_cart_icon_show'     => 'yes',
        'eael_ajax_add_to_cart'     => '',
    ] ),

    ea_heading( 'Add To Cart | Column layout' ),
    ea_widget( 'test-watc-column', 'eael-woo-add-to-cart', [
        'add_to_cart_layout'        => 'column',
        'add_to_cart_show_quantity' => 'yes',
        'add_to_cart_icon_show'     => 'yes',
    ] ),

    ea_heading( 'Add To Cart | Quantity hidden' ),
    ea_widget( 'test-watc-no-qty', 'eael-woo-add-to-cart', [
        'add_to_cart_layout'        => 'row',
        'add_to_cart_show_quantity' => '',
        'add_to_cart_icon_show'     => 'yes',
    ] ),

    ea_heading( 'Add To Cart | Icon hidden' ),
    ea_widget( 'test-watc-no-icon', 'eael-woo-add-to-cart', [
        'add_to_cart_layout'        => 'row',
        'add_to_cart_show_quantity' => 'yes',
        'add_to_cart_icon_show'     => '',
    ] ),

    ea_heading( 'Add To Cart | AJAX enabled' ),
    ea_widget( 'test-watc-ajax', 'eael-woo-add-to-cart', [
        'add_to_cart_layout'        => 'row',
        'add_to_cart_show_quantity' => 'yes',
        'add_to_cart_icon_show'     => 'yes',
        'eael_ajax_add_to_cart'     => 'yes',
    ] ),

    ea_heading( 'Add To Cart | Custom button text "Buy Now"' ),
    ea_widget( 'test-watc-custom-text', 'eael-woo-add-to-cart', [
        'add_to_cart_layout'        => 'row',
        'add_to_cart_show_quantity' => 'yes',
        'add_to_cart_icon_show'     => 'yes',
        'add_to_cart_text'          => 'Buy Now',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Woo Product Images
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Woo Product Images ──', 'h2' ),

    ea_heading( 'Product Images | Default (thumbs bottom, zoom on, sale flash on)' ),
    ea_widget( 'test-wpi-default', 'eael-woo-product-images', [
        'eael_pi_thumbnail'         => 'yes',
        'eael_pi_thumb_position'    => 'bottom',
        'eael_image_zoom_effect'    => 'yes',
        'eael_image_zoom_show'      => 'yes',
        'eael_image_sale_flash'     => 'yes',
        'eael_pi_pagination'        => '',
        'eael_pi_navigation'        => '',
    ] ),

    ea_heading( 'Product Images | Thumbnails left' ),
    ea_widget( 'test-wpi-thumb-left', 'eael-woo-product-images', [
        'eael_pi_thumbnail'      => 'yes',
        'eael_pi_thumb_position' => 'left',
        'eael_image_zoom_effect' => 'yes',
        'eael_image_zoom_show'   => 'yes',
        'eael_image_sale_flash'  => 'yes',
    ] ),

    ea_heading( 'Product Images | Thumbnails right' ),
    ea_widget( 'test-wpi-thumb-right', 'eael-woo-product-images', [
        'eael_pi_thumbnail'      => 'yes',
        'eael_pi_thumb_position' => 'right',
        'eael_image_zoom_effect' => 'yes',
        'eael_image_zoom_show'   => 'yes',
        'eael_image_sale_flash'  => 'yes',
    ] ),

    ea_heading( 'Product Images | No thumbnails' ),
    ea_widget( 'test-wpi-no-thumbs', 'eael-woo-product-images', [
        'eael_pi_thumbnail'     => '',
        'eael_image_zoom_effect'=> 'yes',
        'eael_image_sale_flash' => 'yes',
    ] ),

    ea_heading( 'Product Images | No zoom' ),
    ea_widget( 'test-wpi-no-zoom', 'eael-woo-product-images', [
        'eael_pi_thumbnail'      => 'yes',
        'eael_pi_thumb_position' => 'bottom',
        'eael_image_zoom_effect' => '',
        'eael_image_zoom_show'   => '',
        'eael_image_sale_flash'  => 'yes',
    ] ),

    ea_heading( 'Product Images | With pagination' ),
    ea_widget( 'test-wpi-pagination', 'eael-woo-product-images', [
        'eael_pi_thumbnail'      => 'yes',
        'eael_pi_thumb_position' => 'bottom',
        'eael_pi_pagination'     => 'yes',
        'eael_pi_navigation'     => '',
        'eael_image_zoom_effect' => 'yes',
        'eael_image_sale_flash'  => 'yes',
    ] ),

    ea_heading( 'Product Images | No sale flash' ),
    ea_widget( 'test-wpi-no-sale-flash', 'eael-woo-product-images', [
        'eael_pi_thumbnail'      => 'yes',
        'eael_pi_thumb_position' => 'bottom',
        'eael_image_zoom_effect' => 'yes',
        'eael_image_sale_flash'  => '',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Woo Product Price
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Woo Product Price ──', 'h2' ),

    ea_heading( 'Product Price | Default' ),
    ea_widget( 'test-wpp-default', 'eael-woo-product-price', [
        'sale_price_position' => 'row',
        'stacked_price'       => '',
        'show_prefix'         => '',
        'show_suffix'         => '',
    ] ),

    ea_heading( 'Product Price | With prefix text "Limited Time Offer"' ),
    ea_widget( 'test-wpp-prefix-text', 'eael-woo-product-price', [
        'sale_price_position' => 'row',
        'show_prefix'         => 'yes',
        'prefix_content'      => 'text',
        'prefix_text'         => 'Limited Time Offer',
        'show_suffix'         => '',
    ] ),

    ea_heading( 'Product Price | With suffix text "Sales Ongoing"' ),
    ea_widget( 'test-wpp-suffix-text', 'eael-woo-product-price', [
        'sale_price_position' => 'row',
        'show_prefix'         => '',
        'show_suffix'         => 'yes',
        'suffix_content'      => 'text',
        'suffix_text'         => 'Sales Ongoing',
    ] ),

    ea_heading( 'Product Price | Sale price before regular (row-reverse)' ),
    ea_widget( 'test-wpp-reverse', 'eael-woo-product-price', [
        'sale_price_position' => 'row-reverse',
        'show_prefix'         => '',
        'show_suffix'         => '',
    ] ),

    ea_heading( 'Product Price | Stacked layout' ),
    ea_widget( 'test-wpp-stacked', 'eael-woo-product-price', [
        'sale_price_position' => 'row',
        'stacked_price'       => 'yes',
        'show_prefix'         => '',
        'show_suffix'         => '',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Woo Product Rating
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Woo Product Rating ──', 'h2' ),

    ea_heading( 'Product Rating | Default (style_1, show count)' ),
    ea_widget( 'test-wpr-default', 'eael-woo-product-rating', [
        'show_review_count'      => 'yes',
        'rating_style'           => 'style_1',
        'rating_caption'         => 'Customer Ratings',
        'before_rating_caption'  => '( ',
        'after_rating_caption'   => ' )',
    ] ),

    ea_heading( 'Product Rating | No review count' ),
    ea_widget( 'test-wpr-no-count', 'eael-woo-product-rating', [
        'show_review_count' => '',
        'rating_style'      => 'style_1',
    ] ),

    ea_heading( 'Product Rating | Style 2 (outline)' ),
    ea_widget( 'test-wpr-style-2', 'eael-woo-product-rating', [
        'show_review_count' => 'yes',
        'rating_style'      => 'style_2',
    ] ),

    ea_heading( 'Product Rating | Style 3 (half-stroke)' ),
    ea_widget( 'test-wpr-style-3', 'eael-woo-product-rating', [
        'show_review_count' => 'yes',
        'rating_style'      => 'style_3',
    ] ),

    ea_heading( 'Product Rating | Custom caption brackets [ ... ]' ),
    ea_widget( 'test-wpr-custom-caption', 'eael-woo-product-rating', [
        'show_review_count'     => 'yes',
        'rating_style'          => 'style_1',
        'rating_caption'        => 'Reviews',
        'before_rating_caption' => '[ ',
        'after_rating_caption'  => ' ]',
    ] ),

];

// ── Save Elementor data on the product post ────────────────────────────────

ea_save_elementor_data( $product_id, $widgets );
WP_CLI::log( '  widgets : ' . count( $widgets ) . ' nodes written (includes headings)' );

if ( class_exists( '\Elementor\Core\Files\CSS\Post' ) ) {
    ( new \Elementor\Core\Files\CSS\Post( $product_id ) )->update_file();
    WP_CLI::log( '  CSS     : Elementor CSS regenerated for product ' . $product_id );
} elseif ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->files_manager ) ) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    WP_CLI::log( '  CSS     : cache cleared' );
}

$permalink = get_permalink( $product_id );
WP_CLI::success( 'Single product widgets page ready → ' . $permalink );
