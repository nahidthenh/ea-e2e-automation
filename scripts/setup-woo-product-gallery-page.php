<?php
/**
 * Test page: Woo Product Gallery
 * Run via: wp eval-file /scripts/setup-woo-product-gallery-page.php
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

// ── Woo Product Gallery page ───────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Product Gallery page ---' );

$slug    = getenv( 'WOO_PRODUCT_GALLERY_PAGE_SLUG' ) ?: 'woo-product-gallery';
$page_id = ea_upsert_page( $slug, 'Woo Product Gallery' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Layout Presets
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Layout Presets ──', 'h2' ),

    ea_heading( 'Default Woo Product Gallery (Preset 1)' ),
    ea_widget( 'test-wpg-default', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
        ]
    ),

    ea_heading( 'Woo Product Gallery | Preset 2' ),
    ea_widget( 'test-wpg-preset-2', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-2',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
        ]
    ),

    ea_heading( 'Woo Product Gallery | Preset 3' ),
    ea_widget( 'test-wpg-preset-3', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-3',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
        ]
    ),

    ea_heading( 'Woo Product Gallery | Preset 4' ),
    ea_widget( 'test-wpg-preset-4', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-4',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Product Layout
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Product Layout ──', 'h2' ),

    ea_heading( 'Woo Product Gallery | Layout: Grid' ),
    ea_widget( 'test-wpg-grid', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
            'eael_product_gallery_items_layout'    => 'grid',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Toggles ──', 'h2' ),

    ea_heading( 'Woo Product Gallery | Price: Hidden' ),
    ea_widget( 'test-wpg-no-price', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
            'eael_product_gallery_price'           => '',
        ]
    ),

    ea_heading( 'Woo Product Gallery | Add to Cart: Hidden' ),
    ea_widget( 'test-wpg-no-atc', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'       => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'     => 'recent-products',
            'eael_product_gallery_products_count'     => 6,
            'eael_product_gallery_addtocart_show'     => '',
        ]
    ),

    ea_heading( 'Woo Product Gallery | Quick View: Hidden' ),
    ea_widget( 'test-wpg-no-quickview', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
            'eael_product_gallery_quick_view'      => '',
        ]
    ),

    ea_heading( 'Woo Product Gallery | View Details Link: Hidden' ),
    ea_widget( 'test-wpg-no-link', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 6,
            'eael_product_gallery_link_show'       => '',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Load More
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Load More ──', 'h2' ),

    ea_heading( 'Woo Product Gallery | Load More: Button' ),
    ea_widget( 'test-wpg-load-more', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'recent-products',
            'eael_product_gallery_products_count'  => 3,
            'show_load_more'                       => 'true',
            'show_load_more_text'                  => 'Load More',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Product Filters
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Product Filters ──', 'h2' ),

    ea_heading( 'Woo Product Gallery | Filter: Featured Products' ),
    ea_widget( 'test-wpg-filter-featured', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'featured-products',
            'eael_product_gallery_products_count'  => 6,
        ]
    ),

    ea_heading( 'Woo Product Gallery | Filter: Sale Products' ),
    ea_widget( 'test-wpg-filter-sale', 'eael-woo-product-gallery',
        [
            'eael_product_gallery_style_preset'    => 'eael-product-preset-1',
            'eael_product_gallery_product_filter'  => 'sale-products',
            'eael_product_gallery_products_count'  => 6,
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

WP_CLI::success( 'Woo Product Gallery page ready → /woo-product-gallery/' );
