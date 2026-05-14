<?php
/**
 * Test page: Pricing Table
 * Run via: wp eval-file /scripts/setup-pricing-table-page.php
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

// - Pricing Table page ---------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Pricing Table page ---' );

$slug    = getenv( 'PRICING_TABLE_PAGE_SLUG' ) ?: 'pricing-table';
$page_id = ea_upsert_page( $slug, 'Pricing Table' );

// Shared feature list items used across most widget instances
$default_items = [
    [ '_id' => 'item01', 'eael_pricing_table_item' => 'Unlimited calls',    'eael_pricing_table_list_icon_new' => [ 'value' => 'fas fa-check', 'library' => 'fa-solid' ], 'eael_pricing_table_icon_mood' => 'yes',  'eael_pricing_item_tooltip' => '' ],
    [ '_id' => 'item02', 'eael_pricing_table_item' => 'Free hosting',       'eael_pricing_table_list_icon_new' => [ 'value' => 'fas fa-check', 'library' => 'fa-solid' ], 'eael_pricing_table_icon_mood' => 'yes',  'eael_pricing_item_tooltip' => '' ],
    [ '_id' => 'item03', 'eael_pricing_table_item' => '500 MB storage',     'eael_pricing_table_list_icon_new' => [ 'value' => 'fas fa-times', 'library' => 'fa-solid' ], 'eael_pricing_table_icon_mood' => 'no',   'eael_pricing_item_tooltip' => '' ],
];

$widgets = [

    // ====================================================================
    // Free Styles
    // ====================================================================

    ea_heading( '- Free Styles -', 'h2' ),

    ea_heading( 'Default Pricing Table (Style 1)' ),
    ea_widget( 'test-pt-default', 'eael-pricing-table', [
        'eael_pricing_table_style'        => 'style-1',
        'eael_pricing_table_title'        => 'Startup',
        'eael_pricing_table_price'        => '99',
        'eael_pricing_table_price_cur'    => '$',
        'eael_pricing_table_price_period' => 'month',
        'eael_pricing_table_btn'          => 'Choose Plan',
        'eael_pricing_table_btn_link'     => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'  => 'yes',
        'eael_pricing_table_items'        => $default_items,
    ] ),

    ea_heading( 'Pricing Table | Style 2 (with icon & subtitle)' ),
    ea_widget( 'test-pt-style-2', 'eael-pricing-table', [
        'eael_pricing_table_style'          => 'style-2',
        'eael_pricing_table_title'          => 'Business',
        'eael_pricing_table_sub_title'      => 'Best for teams',
        'eael_pricing_table_style_2_icon_new' => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        'eael_pricing_table_price'          => '49',
        'eael_pricing_table_price_cur'      => '$',
        'eael_pricing_table_price_period'   => 'month',
        'eael_pricing_table_btn'            => 'Get Started',
        'eael_pricing_table_btn_link'       => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'    => 'yes',
        'eael_pricing_table_items'          => $default_items,
    ] ),

    // ====================================================================
    // List Icon Variants
    // ====================================================================

    ea_heading( '- List Icon Variants -', 'h2' ),

    ea_heading( 'Pricing Table | List Icon: Off' ),
    ea_widget( 'test-pt-icon-off', 'eael-pricing-table', [
        'eael_pricing_table_style'           => 'style-1',
        'eael_pricing_table_title'           => 'Startup',
        'eael_pricing_table_icon_enabled'    => '',
        'eael_pricing_table_price'           => '99',
        'eael_pricing_table_price_cur'       => '$',
        'eael_pricing_table_price_period'    => 'month',
        'eael_pricing_table_btn'             => 'Choose Plan',
        'eael_pricing_table_btn_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'     => 'yes',
        'eael_pricing_table_items'           => $default_items,
    ] ),

    ea_heading( 'Pricing Table | List Icon: Right' ),
    ea_widget( 'test-pt-icon-right', 'eael-pricing-table', [
        'eael_pricing_table_style'           => 'style-1',
        'eael_pricing_table_title'           => 'Startup',
        'eael_pricing_table_icon_enabled'    => 'show',
        'eael_pricing_table_icon_placement'  => 'right',
        'eael_pricing_table_price'           => '99',
        'eael_pricing_table_price_cur'       => '$',
        'eael_pricing_table_price_period'    => 'month',
        'eael_pricing_table_btn'             => 'Choose Plan',
        'eael_pricing_table_btn_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'     => 'yes',
        'eael_pricing_table_items'           => $default_items,
    ] ),

    // ====================================================================
    // Ribbon / Featured Variants
    // ====================================================================

    ea_heading( '- Ribbon / Featured Variants -', 'h2' ),

    ea_heading( 'Pricing Table | Featured: Ribbon 1' ),
    ea_widget( 'test-pt-ribbon-1', 'eael-pricing-table', [
        'eael_pricing_table_style'            => 'style-1',
        'eael_pricing_table_title'            => 'Popular',
        'eael_pricing_table_featured'         => 'yes',
        'eael_pricing_table_featured_styles'  => 'ribbon-1',
        'eael_pricing_table_price'            => '99',
        'eael_pricing_table_price_cur'        => '$',
        'eael_pricing_table_price_period'     => 'month',
        'eael_pricing_table_btn'              => 'Choose Plan',
        'eael_pricing_table_btn_link'         => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'      => 'yes',
        'eael_pricing_table_items'            => $default_items,
    ] ),

    ea_heading( 'Pricing Table | Featured: Ribbon 2 with tag text' ),
    ea_widget( 'test-pt-ribbon-2', 'eael-pricing-table', [
        'eael_pricing_table_style'              => 'style-1',
        'eael_pricing_table_title'              => 'Popular',
        'eael_pricing_table_featured'           => 'yes',
        'eael_pricing_table_featured_styles'    => 'ribbon-2',
        'eael_pricing_table_featured_tag_text'  => 'Best Value',
        'eael_pricing_table_price'              => '99',
        'eael_pricing_table_price_cur'          => '$',
        'eael_pricing_table_price_period'       => 'month',
        'eael_pricing_table_btn'                => 'Choose Plan',
        'eael_pricing_table_btn_link'           => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'        => 'yes',
        'eael_pricing_table_items'              => $default_items,
    ] ),

    // ====================================================================
    // Button Variants
    // ====================================================================

    ea_heading( '- Button Variants -', 'h2' ),

    ea_heading( 'Pricing Table | Button Hidden' ),
    ea_widget( 'test-pt-btn-hide', 'eael-pricing-table', [
        'eael_pricing_table_style'           => 'style-1',
        'eael_pricing_table_title'           => 'Free',
        'eael_pricing_table_price'           => '0',
        'eael_pricing_table_price_cur'       => '$',
        'eael_pricing_table_price_period'    => 'month',
        'eael_pricing_table_button_show'     => '',
        'eael_pricing_table_items'           => $default_items,
    ] ),

    ea_heading( 'Pricing Table | External Link (target=_blank)' ),
    ea_widget( 'test-pt-btn-external', 'eael-pricing-table', [
        'eael_pricing_table_style'           => 'style-1',
        'eael_pricing_table_title'           => 'Enterprise',
        'eael_pricing_table_price'           => '199',
        'eael_pricing_table_price_cur'       => '$',
        'eael_pricing_table_price_period'    => 'year',
        'eael_pricing_table_btn'             => 'Buy Now',
        'eael_pricing_table_btn_link'        => [ 'url' => 'https://essential-addons.com', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'     => 'yes',
        'eael_pricing_table_items'           => $default_items,
    ] ),

    ea_heading( 'Pricing Table | Nofollow Link' ),
    ea_widget( 'test-pt-btn-nofollow', 'eael-pricing-table', [
        'eael_pricing_table_style'           => 'style-1',
        'eael_pricing_table_title'           => 'Pro',
        'eael_pricing_table_price'           => '149',
        'eael_pricing_table_price_cur'       => '$',
        'eael_pricing_table_price_period'    => 'month',
        'eael_pricing_table_btn'             => 'Subscribe',
        'eael_pricing_table_btn_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'     => 'yes',
        'eael_pricing_table_items'           => $default_items,
    ] ),

    // ====================================================================
    // Pricing Variants
    // ====================================================================

    ea_heading( '- Pricing Variants -', 'h2' ),

    ea_heading( 'Pricing Table | On Sale' ),
    ea_widget( 'test-pt-onsale', 'eael-pricing-table', [
        'eael_pricing_table_style'           => 'style-1',
        'eael_pricing_table_title'           => 'Startup',
        'eael_pricing_table_price'           => '99',
        'eael_pricing_table_onsale'          => 'yes',
        'eael_pricing_table_onsale_price'    => '79',
        'eael_pricing_table_price_cur'       => '$',
        'eael_pricing_table_price_period'    => 'month',
        'eael_pricing_table_btn'             => 'Grab Deal',
        'eael_pricing_table_btn_link'        => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'     => 'yes',
        'eael_pricing_table_items'           => $default_items,
    ] ),

    // ====================================================================
    // Pro Styles
    // ====================================================================

    ea_heading( '- Pro Styles -', 'h2' ),

    ea_heading( 'Pro Style 3' ),
    ea_widget( 'test-pt-pro-style-3', 'eael-pricing-table', [
        'eael_pricing_table_style'        => 'style-3',
        'eael_pricing_table_title'        => 'Agency',
        'eael_pricing_table_sub_title'    => 'For growing teams',
        'eael_pricing_table_price'        => '149',
        'eael_pricing_table_price_cur'    => '$',
        'eael_pricing_table_price_period' => 'month',
        'eael_pricing_table_btn'          => 'Get Started',
        'eael_pricing_table_btn_link'     => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'  => 'yes',
        'eael_pricing_table_items'        => $default_items,
    ] ),

    ea_heading( 'Pro Style 4' ),
    ea_widget( 'test-pt-pro-style-4', 'eael-pricing-table', [
        'eael_pricing_table_style'        => 'style-4',
        'eael_pricing_table_title'        => 'Enterprise',
        'eael_pricing_table_sub_title'    => 'For large organizations',
        'eael_pricing_table_price'        => '299',
        'eael_pricing_table_price_cur'    => '$',
        'eael_pricing_table_price_period' => 'month',
        'eael_pricing_table_btn'          => 'Contact Sales',
        'eael_pricing_table_btn_link'     => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'  => 'yes',
        'eael_pricing_table_items'        => $default_items,
    ] ),

    ea_heading( 'Pro Style 5' ),
    ea_widget( 'test-pt-pro-style-5', 'eael-pricing-table', [
        'eael_pricing_table_style'                => 'style-5',
        'eael_pricing_table_title'                => 'Ultimate',
        'eael_pricing_table_sub_title'            => 'Everything included',
        'eael_pricing_table_style_2_icon_new'     => [ 'value' => 'eicon-diamond', 'library' => 'eicons' ],
        'eael_pricing_table_price'                => '499',
        'eael_pricing_table_price_cur'            => '$',
        'eael_pricing_table_price_period'         => 'month',
        'eael_pricing_table_btn'                  => 'Go Ultimate',
        'eael_pricing_table_btn_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
        'eael_pricing_table_button_show'          => 'yes',
        'eael_pricing_table_items'                => $default_items,
    ] ),

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

WP_CLI::success( 'Pricing Table page ready → /pricing-table/' );
