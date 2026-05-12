<?php
/**
 * Test page: Woo Product Carousel
 * Run via: wp eval-file /scripts/setup-woo-product-carousel-page.php
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

// - Woo Product Carousel page -----------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Woo Product Carousel page ---' );

$slug    = getenv( 'WOO_PRODUCT_CAROUSEL_PAGE_SLUG' ) ?: 'woo-product-carousel';
$page_id = ea_upsert_page( $slug, 'Woo Product Carousel' );

$widgets = [

    // ====================================================================
    // Layout Presets
    // ====================================================================

    ea_heading( '- Layout Presets -', 'h2' ),

    ea_heading( 'Default Woo Product Carousel (Preset 1)' ),
    ea_widget( 'test-wpc-default', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Layout: Preset 2' ),
    ea_widget( 'test-wpc-preset-2', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-2',
            'eael_product_carousel_product_filter'      => 'recent-products',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Layout: Preset 3' ),
    ea_widget( 'test-wpc-preset-3', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-3',
            'eael_product_carousel_product_filter'      => 'recent-products',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Layout: Preset 4' ),
    ea_widget( 'test-wpc-preset-4', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-4',
            'eael_product_carousel_product_filter'      => 'recent-products',
        ]
    ),

    // ====================================================================
    // Content Toggles
    // ====================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'Woo Product Carousel | Title: Hidden' ),
    ea_widget( 'test-wpc-no-title', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'eael_product_carousel_show_title'          => '',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Price: Hidden' ),
    ea_widget( 'test-wpc-no-price', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'eael_product_carousel_price'               => '',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Rating: Hidden' ),
    ea_widget( 'test-wpc-no-rating', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'eael_product_carousel_rating'              => '',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Add-to-Cart: Hidden' ),
    ea_widget( 'test-wpc-no-atc', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'eael_product_carousel_show_add_to_cart'    => '',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Buttons: Static' ),
    ea_widget( 'test-wpc-static-buttons', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'eael_product_button_appearance'            => 'static',
        ]
    ),

    // ====================================================================
    // Carousel Effects
    // ====================================================================

    ea_heading( '- Carousel Effects -', 'h2' ),

    ea_heading( 'Woo Product Carousel | Effect: Coverflow' ),
    ea_widget( 'test-wpc-coverflow', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'carousel_effect'                           => 'coverflow',
        ]
    ),

    // ====================================================================
    // Slider Controls
    // ====================================================================

    ea_heading( '- Slider Controls -', 'h2' ),

    ea_heading( 'Woo Product Carousel | Arrows: On' ),
    ea_widget( 'test-wpc-arrows', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'arrows'                                    => 'yes',
        ]
    ),

    ea_heading( 'Woo Product Carousel | Autoplay: On' ),
    ea_widget( 'test-wpc-autoplay', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'autoplay'                                  => 'yes',
            'autoplay_speed'                            => [ 'size' => 3000 ],
        ]
    ),

    ea_heading( 'Woo Product Carousel | Loop: Off' ),
    ea_widget( 'test-wpc-no-loop', 'eael-woo-product-carousel',
        [
            'eael_dynamic_template_layout'              => 'preset-1',
            'eael_product_carousel_product_filter'      => 'recent-products',
            'infinite_loop'                             => '',
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

WP_CLI::success( 'Woo Product Carousel page ready → /woo-product-carousel/' );
