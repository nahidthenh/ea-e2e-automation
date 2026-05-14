<?php
/**
 * Test page: Static Product
 * Run via: wp eval-file /scripts/setup-static-product-page.php
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
        update_post_meta( $page_id, '_elementor_data', wp_slash( wp_json_encode( $data ) ) );
        update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
        update_post_meta( $page_id, '_elementor_version', '3.0.0' );
        delete_post_meta( $page_id, '_elementor_css' );
    }
}

// - Static Product page --------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Static Product page ---' );

$slug    = getenv( 'STATIC_PRODUCT_PAGE_SLUG' ) ?: 'static-product';
$page_id = ea_upsert_page( $slug, 'Static Product' );

$widgets = [

    // ====================================================================
    // Layouts
    // ====================================================================

    ea_heading( '- Layouts -', 'h2' ),

    ea_heading( 'Default Static Product' ),
    ea_widget( 'test-sp-default', 'eael-static-product',
        [
            'eael_static_product_layout'           => 'default',
            'eael_static_product_heading'          => 'Test Static Product',
            'eael_static_product_description'      => 'Default layout with details button.',
            'eael_static_product_show_details_btn' => 'yes',
            'eael_static_product_btn'              => 'View Details',
            'eael_static_product_link_url'         => '#',
            'eael_static_product_demo_text'        => 'Live Demo',
            'eael_static_product_demo_link_url'    => '#',
        ]
    ),

    ea_heading( 'Layout: Cart Button On Hover (layout two)' ),
    ea_widget( 'test-sp-layout-two', 'eael-static-product',
        [
            'eael_static_product_layout'                    => 'two',
            'eael_static_product_heading'                   => 'Layout Two Product',
            'eael_static_product_description'               => 'Cart button shown on hover image.',
            'eael_static_product_show_details_btn'          => 'yes',
            'eael_static_product_btn'                       => 'View Details',
            'eael_static_product_show_add_to_cart_button'   => 'yes',
            'eael_static_product_add_to_cart_btn'           => 'Add To Cart',
            'eael_static_product_link_url'                  => '#',
            'eael_static_product_demo_text'                 => 'Live Demo',
            'eael_static_product_demo_link_url'             => '#',
        ]
    ),

    ea_heading( 'Layout: All Content On Hover (layout three)' ),
    ea_widget( 'test-sp-layout-three', 'eael-static-product',
        [
            'eael_static_product_layout'           => 'three',
            'eael_static_product_heading'          => 'Layout Three Product',
            'eael_static_product_description'      => 'All content shown on hover image.',
            'eael_static_product_show_details_btn' => 'yes',
            'eael_static_product_btn'              => 'View Details',
            'eael_static_product_link_url'         => '#',
            'eael_static_product_demo_text'        => 'Live Demo',
            'eael_static_product_demo_link_url'    => '#',
        ]
    ),

    // ====================================================================
    // Price & Rating Variants
    // ====================================================================

    ea_heading( '- Price & Rating Variants -', 'h2' ),

    ea_heading( 'Static Product | Price Visible' ),
    ea_widget( 'test-sp-with-price', 'eael-static-product',
        [
            'eael_static_product_layout'             => 'default',
            'eael_static_product_heading'            => 'Price Display Product',
            'eael_static_product_description'        => 'Price is visible below description.',
            'eael_static_product_is_show_price'      => 'yes',
            'eael_static_product_price'              => '$49.99',
            'eael_static_product_show_details_btn'   => 'yes',
            'eael_static_product_btn'                => 'View Details',
            'eael_static_product_link_url'           => '#',
            'eael_static_product_demo_text'          => 'Live Demo',
            'eael_static_product_demo_link_url'      => '#',
        ]
    ),

    ea_heading( 'Static Product | Rating Visible' ),
    ea_widget( 'test-sp-with-rating', 'eael-static-product',
        [
            'eael_static_product_layout'             => 'default',
            'eael_static_product_heading'            => 'Rating Display Product',
            'eael_static_product_description'        => 'Star rating is visible.',
            'eael_static_product_is_show_rating'     => 'yes',
            'eael_static_product_review'             => '(4.8 Reviews)',
            'eael_static_product_show_details_btn'   => 'yes',
            'eael_static_product_btn'                => 'View Details',
            'eael_static_product_link_url'           => '#',
            'eael_static_product_demo_text'          => 'Live Demo',
            'eael_static_product_demo_link_url'      => '#',
        ]
    ),

    // ====================================================================
    // Button Variants
    // ====================================================================

    ea_heading( '- Button Variants -', 'h2' ),

    ea_heading( 'Static Product | No Details Button' ),
    ea_widget( 'test-sp-no-details-btn', 'eael-static-product',
        [
            'eael_static_product_layout'           => 'default',
            'eael_static_product_heading'          => 'No Details Button',
            'eael_static_product_description'      => 'Details button is hidden.',
            'eael_static_product_show_details_btn' => '',
            'eael_static_product_link_url'         => '#',
            'eael_static_product_demo_text'        => 'Live Demo',
            'eael_static_product_demo_link_url'    => '#',
        ]
    ),

    ea_heading( 'Static Product | Live Demo Icon' ),
    ea_widget( 'test-sp-demo-icon', 'eael-static-product',
        [
            'eael_static_product_layout'               => 'default',
            'eael_static_product_heading'              => 'Demo Icon Product',
            'eael_static_product_description'          => 'Live demo button uses an icon.',
            'eael_static_product_show_details_btn'     => 'yes',
            'eael_static_product_btn'                  => 'View Details',
            'eael_static_product_link_url'             => '#',
            'eael_static_product_demo_is_used_icon'    => 'yes',
            'eael_static_product_demo_icon'            => [
                'value'   => 'eicon-eye',
                'library' => 'eicons',
            ],
            'eael_static_product_demo_link_url'        => '#',
        ]
    ),

    // ====================================================================
    // Link Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Static Product | External Link (target=_blank)' ),
    ea_widget( 'test-sp-link-external', 'eael-static-product',
        [
            'eael_static_product_layout'           => 'default',
            'eael_static_product_heading'          => 'External Link Product',
            'eael_static_product_description'      => 'Product link opens in a new tab.',
            'eael_static_product_show_details_btn' => 'yes',
            'eael_static_product_btn'              => 'View Details',
            'eael_static_product_link_url'         => 'https://essential-addons.com',
            'eael_static_product_link_target'      => '_blank',
            'eael_static_product_demo_text'        => 'Live Demo',
            'eael_static_product_demo_link_url'    => '#',
        ]
    ),

    // ====================================================================
    // Content Alignment
    // ====================================================================

    ea_heading( '- Content Alignment -', 'h2' ),

    ea_heading( 'Static Product | Align Left' ),
    ea_widget( 'test-sp-align-left', 'eael-static-product',
        [
            'eael_static_product_layout'              => 'default',
            'eael_static_product_heading'             => 'Left Aligned Product',
            'eael_static_product_description'         => 'Text content is left-aligned.',
            'eael_static_product_text_alignment'      => 'left',
            'eael_static_product_show_details_btn'    => 'yes',
            'eael_static_product_btn'                 => 'View Details',
            'eael_static_product_link_url'            => '#',
            'eael_static_product_demo_text'           => 'Live Demo',
            'eael_static_product_demo_link_url'       => '#',
        ]
    ),

    ea_heading( 'Static Product | Align Right' ),
    ea_widget( 'test-sp-align-right', 'eael-static-product',
        [
            'eael_static_product_layout'              => 'default',
            'eael_static_product_heading'             => 'Right Aligned Product',
            'eael_static_product_description'         => 'Text content is right-aligned.',
            'eael_static_product_text_alignment'      => 'right',
            'eael_static_product_show_details_btn'    => 'yes',
            'eael_static_product_btn'                 => 'View Details',
            'eael_static_product_link_url'            => '#',
            'eael_static_product_demo_text'           => 'Live Demo',
            'eael_static_product_demo_link_url'       => '#',
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

WP_CLI::success( 'Static Product page ready → /' . $slug . '/' );
