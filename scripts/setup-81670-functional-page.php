<?php
/**
 * Setup: branch 81670 functional regression test
 *
 * Creates a password-protected WooCommerce product and a test page with four
 * EA Woo listing widgets that were affected by the revert:
 *   - Woo Product List
 *   - Woo Product Grid (free: eael-product-grid, pro: eael-woo-product-grid)
 *   - Woo Product Carousel
 *   - Woo Product Gallery
 *
 * Run via: wp eval-file /scripts/setup-81670-functional-page.php
 */

if ( ! function_exists( 'ea_make_id' ) ) {
    function ea_make_id(): string {
        return substr( md5( uniqid( '', true ) ), 0, 8 );
    }
}
if ( ! function_exists( 'ea_upsert_page' ) ) {
    function ea_upsert_page( string $slug, string $title ): int {
        $existing = get_page_by_path( $slug, OBJECT, 'page' );
        if ( $existing ) {
            WP_CLI::log( "  exists : {$title} (ID {$existing->ID})" );
            return (int) $existing->ID;
        }
        $id = wp_insert_post( [
            'post_type'   => 'page',
            'post_status' => 'publish',
            'post_title'  => $title,
            'post_name'   => $slug,
        ], true );
        if ( is_wp_error( $id ) ) WP_CLI::error( $id->get_error_message() );
        WP_CLI::log( "  created: {$title} (ID {$id})" );
        return (int) $id;
    }
}
if ( ! function_exists( 'ea_widget' ) ) {
    function ea_widget( string $css_class, string $widget_type, array $settings ): array {
        return [
            'id'         => ea_make_id(),
            'elType'     => 'widget',
            'widgetType' => $widget_type,
            'settings'   => array_merge( [ '_css_classes' => $css_class ], $settings ),
            'elements'   => [],
        ];
    }
}
if ( ! function_exists( 'ea_heading' ) ) {
    function ea_heading( string $title, string $tag = 'h4' ): array {
        return [
            'id'         => ea_make_id(),
            'elType'     => 'widget',
            'widgetType' => 'heading',
            'settings'   => [ 'title' => $title, 'header_size' => $tag ],
            'elements'   => [],
        ];
    }
}
if ( ! function_exists( 'ea_build_elementor_data' ) ) {
    function ea_build_elementor_data( array $widgets ): array {
        return [ [
            'id'       => ea_make_id(),
            'elType'   => 'section',
            'isInner'  => false,
            'settings' => [],
            'elements' => [ [
                'id'       => ea_make_id(),
                'elType'   => 'column',
                'isInner'  => false,
                'settings' => [ '_column_size' => 100 ],
                'elements' => $widgets,
            ] ],
        ] ];
    }
}
if ( ! function_exists( 'ea_save_elementor_data' ) ) {
    function ea_save_elementor_data( int $page_id, array $widgets ): void {
        $data = ea_build_elementor_data( $widgets );
        update_post_meta( $page_id, '_elementor_data', wp_slash( wp_json_encode( $data ) ) );
        update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
        update_post_meta( $page_id, '_elementor_version', '3.0.0' );
        delete_post_meta( $page_id, '_elementor_css' );
    }
}

// ── 1. Password-protected product ────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Password-protected product ---' );

$protected_title = 'EA Test — Password Protected Product';
$existing_product = get_posts( [
    'post_type'   => 'product',
    'post_status' => 'publish',
    'title'       => $protected_title,
    'numberposts' => 1,
] );

if ( $existing_product ) {
    $product_id = $existing_product[0]->ID;
    WP_CLI::log( "  exists : {$protected_title} (ID {$product_id})" );
} else {
    $product_id = wp_insert_post( [
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'post_title'     => $protected_title,
        'post_name'      => 'ea-test-password-protected-product',
        'post_password'  => 'test123',
        'post_content'   => 'This product is password-protected. You should see it in listing widgets but the page requires a password.',
        'post_excerpt'   => 'Password protected product for EA security regression test.',
    ] );
    if ( is_wp_error( $product_id ) ) WP_CLI::error( $product_id->get_error_message() );

    // Set WooCommerce product meta
    update_post_meta( $product_id, '_price', '29.99' );
    update_post_meta( $product_id, '_regular_price', '29.99' );
    update_post_meta( $product_id, '_sku', 'EA-PWD-001' );
    update_post_meta( $product_id, '_visibility', 'visible' );
    update_post_meta( $product_id, '_stock_status', 'instock' );
    update_post_meta( $product_id, '_virtual', 'no' );
    update_post_meta( $product_id, '_downloadable', 'no' );
    wp_set_object_terms( $product_id, 'simple', 'product_type' );
    WC()->product_factory && wc_delete_product_transients( $product_id );

    WP_CLI::log( "  created: {$protected_title} (ID {$product_id})" );
}

WP_CLI::log( "  Password: test123 | URL: " . get_permalink( $product_id ) );

// ── 2. Test page with four listing widgets ───────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- 81670 functional regression test page ---' );

$page_id = ea_upsert_page( '81670-functional-test', '81670 — Password-Protected Product in Woo Widgets' );

// Common query settings — show all products including password-protected ones
$common = [
    'eael_product_grid_product_filter' => 'recent',
    'eael_product_grid_posts_count'    => 8,
];

$widgets = [
    // ── Woo Product List ──────────────────────────────────────────────────
    ea_heading( '1. Woo Product List — password-protected product must appear', 'h3' ),
    ea_widget( 'test-81670-product-list', 'eael-woo-product-list', array_merge( $common, [
        'eael_product_list_layout'  => 'preset-1',
    ] ) ),

    // ── Woo Product Grid ─────────────────────────────────────────────────
    ea_heading( '2. Woo Product Grid — password-protected product must appear', 'h3' ),
    ea_widget( 'test-81670-product-grid', 'eicon-woocommerce', array_merge( $common, [
        'eael_product_grid_layout' => 'preset-1',
    ] ) ),

    // ── Woo Product Carousel ─────────────────────────────────────────────
    ea_heading( '3. Woo Product Carousel — password-protected product must appear', 'h3' ),
    ea_widget( 'test-81670-product-carousel', 'eael-woo-product-carousel', array_merge( $common, [
        'eael_product_carousel_layout' => 'preset-1',
    ] ) ),

    // ── Woo Product Gallery ──────────────────────────────────────────────
    ea_heading( '4. Woo Product Gallery — password-protected product must appear', 'h3' ),
    ea_widget( 'test-81670-product-gallery', 'eael-woo-product-gallery', array_merge( $common, [
        'eael_product_gallery_layout' => 'preset-1',
    ] ) ),
];

ea_save_elementor_data( $page_id, $widgets );

$page_url = get_permalink( $page_id );
WP_CLI::success( 'Test page ready.' );
WP_CLI::log( "  Page URL   : {$page_url}" );
WP_CLI::log( "  Product URL: " . get_permalink( $product_id ) . " (password: test123)" );
WP_CLI::log( "  Product ID : {$product_id}" );
WP_CLI::log( '' );
WP_CLI::log( 'What to verify:' );
WP_CLI::log( '  [ ] "EA Test — Password Protected Product" appears in all 4 listing widgets' );
WP_CLI::log( '  [ ] Clicking the product card leads to a password-entry page (not the full product)' );
WP_CLI::log( '  [ ] No other products are missing from the listings' );
