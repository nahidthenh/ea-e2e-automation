<?php
/**
 * Test page: Woo Product Compare
 * Run via: wp eval-file /scripts/setup-woo-product-compare-page.php
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
            update_post_meta( (int) $existing->ID, '_wp_page_template', 'elementor-full-width' );
            return (int) $existing->ID;
        }
        $id = wp_insert_post( [
            'post_type' => 'page', 'post_status' => 'publish',
            'post_title' => $title, 'post_name' => $slug,
        ], true );
        if ( is_wp_error( $id ) ) WP_CLI::error( $id->get_error_message() );
        update_post_meta( $id, '_wp_page_template', 'elementor-full-width' );
        WP_CLI::log( "  created: {$title} (ID {$id})" );
        return (int) $id;
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

// ── Woo Product Compare page ───────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Product Compare page ---' );

// Fetch up to 3 published product IDs for widgets that need real products.
$sample_ids = [];
if ( function_exists( 'wc_get_products' ) ) {
    $sample_ids = wc_get_products( [
        'limit'  => 3,
        'status' => 'publish',
        'return' => 'ids',
    ] );
}
WP_CLI::log( '  sample product IDs: ' . implode( ', ', $sample_ids ) );

$slug    = getenv( 'WOO_PRODUCT_COMPARE_PAGE_SLUG' ) ?: 'woo-product-compare';
$page_id = ea_upsert_page( $slug, 'Woo Product Compare' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Empty State
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Empty State ──', 'h2' ),

    ea_heading( 'Default Woo Product Compare (no products)' ),
    ea_widget( 'test-wpco-default', 'eael-woo-product-compare',
        [
            'product_ids' => [],
            'theme'       => '',
            'table_title' => 'Compare Products',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // With Products
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── With Products ──', 'h2' ),

    ea_heading( 'Woo Product Compare | With Products (default theme)' ),
    ea_widget( 'test-wpco-with-products', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => '',
            'table_title' => 'Compare Products',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Theme Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Theme Variants ──', 'h2' ),

    ea_heading( 'Woo Product Compare | Theme 1' ),
    ea_widget( 'test-wpco-theme-1', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => 'theme-1',
            'table_title' => 'Compare Products',
        ]
    ),

    ea_heading( 'Woo Product Compare | Theme 2' ),
    ea_widget( 'test-wpco-theme-2', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => 'theme-2',
            'table_title' => 'Compare Products',
        ]
    ),

    ea_heading( 'Woo Product Compare | Theme 3' ),
    ea_widget( 'test-wpco-theme-3', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => 'theme-3',
            'table_title' => 'Compare Products',
        ]
    ),

    ea_heading( 'Woo Product Compare | Theme 4' ),
    ea_widget( 'test-wpco-theme-4', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => 'theme-4',
            'table_title' => 'Compare Products',
        ]
    ),

    ea_heading( 'Woo Product Compare | Theme 5' ),
    ea_widget( 'test-wpco-theme-5', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => 'theme-5',
            'table_title' => 'Compare Products',
        ]
    ),

    ea_heading( 'Woo Product Compare | Theme 6' ),
    ea_widget( 'test-wpco-theme-6', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => 'theme-6',
            'table_title' => 'Compare Products',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Table Title
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Table Title ──', 'h2' ),

    ea_heading( 'Woo Product Compare | No Table Title' ),
    ea_widget( 'test-wpco-no-title', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => '',
            'table_title' => '',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Options
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Options ──', 'h2' ),

    ea_heading( 'Woo Product Compare | Linkable Image: On' ),
    ea_widget( 'test-wpco-linkable-img', 'eael-woo-product-compare',
        [
            'product_ids' => $sample_ids,
            'theme'       => '',
            'table_title' => 'Compare Products',
            'linkable_img' => 'yes',
        ]
    ),

    ea_heading( 'Woo Product Compare | Repeat Price: Off' ),
    ea_widget( 'test-wpco-no-repeat-price', 'eael-woo-product-compare',
        [
            'product_ids'  => $sample_ids,
            'theme'        => '',
            'table_title'  => 'Compare Products',
            'repeat_price' => '',
        ]
    ),

    ea_heading( 'Woo Product Compare | Repeat Add-to-Cart: On' ),
    ea_widget( 'test-wpco-repeat-atc', 'eael-woo-product-compare',
        [
            'product_ids'        => $sample_ids,
            'theme'              => '',
            'table_title'        => 'Compare Products',
            'repeat_add_to_cart' => 'yes',
        ]
    ),

];

ea_save_elementor_data( $page_id, $widgets );
WP_CLI::log( '  widgets : ' . count( $widgets ) . ' nodes written (includes headings)' );

if ( class_exists( '\Elementor\Core\Files\CSS\Post' ) ) {
    ( new \Elementor\Core\Files\CSS\Post( $page_id ) )->update_file();
    WP_CLI::log( '  CSS     : Elementor CSS regenerated for page ' . $page_id );
} elseif ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->files_manager ) ) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    WP_CLI::log( '  CSS     : cache cleared' );
}

WP_CLI::success( 'Woo Product Compare page ready → /woo-product-compare/' );
