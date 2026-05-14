<?php
/**
 * Test page: Multicolumn Pricing Table
 * Run via: wp eval-file /scripts/setup-multicolumn-pricing-table-page.php
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

// - Multicolumn Pricing Table page ----------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Multicolumn Pricing Table page ---' );

$slug    = getenv( 'MULTICOLUMN_PRICING_TABLE_PAGE_SLUG' ) ?: 'multicolumn-pricing-table';
$page_id = ea_upsert_page( $slug, 'Multicolumn Pricing Table' );

// Shared packages used for most instances
$default_packages = [
    [
        '_id'                               => 'pack01',
        'eael_mcpt_package_title'           => 'Silver',
        'eael_mcpt_package_is_featured'     => '',
        'eael_mcpt_package_currency'        => '$',
        'eael_mcpt_package_currency_position' => 'left',
        'eael_mcpt_package_price'           => 9,
        'eael_mcpt_package_sale_price'      => '',
        'eael_mcpt_package_period'          => 'month',
        'eael_mcpt_package_period_separator'=> '/',
        'eael_mcpt_package_enable_button'   => 'yes',
        'eael_mcpt_package_button_text'     => 'Get Silver',
        'eael_mcpt_package_link'            => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ],
    [
        '_id'                               => 'pack02',
        'eael_mcpt_package_title'           => 'Bronze',
        'eael_mcpt_package_is_featured'     => '',
        'eael_mcpt_package_currency'        => '$',
        'eael_mcpt_package_currency_position' => 'left',
        'eael_mcpt_package_price'           => 19,
        'eael_mcpt_package_sale_price'      => '',
        'eael_mcpt_package_period'          => 'month',
        'eael_mcpt_package_period_separator'=> '/',
        'eael_mcpt_package_enable_button'   => 'yes',
        'eael_mcpt_package_button_text'     => 'Get Bronze',
        'eael_mcpt_package_link'            => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ],
    [
        '_id'                               => 'pack03',
        'eael_mcpt_package_title'           => 'Gold',
        'eael_mcpt_package_is_featured'     => '',
        'eael_mcpt_package_currency'        => '$',
        'eael_mcpt_package_currency_position' => 'left',
        'eael_mcpt_package_price'           => 29,
        'eael_mcpt_package_sale_price'      => '',
        'eael_mcpt_package_period'          => 'month',
        'eael_mcpt_package_period_separator'=> '/',
        'eael_mcpt_package_enable_button'   => 'yes',
        'eael_mcpt_package_button_text'     => 'Get Gold',
        'eael_mcpt_package_link'            => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ],
];

// Shared feature titles
$default_features = [
    [ '_id' => 'feat01', 'eael_mcpt_feature_title' => 'Total Features',    'eael_mcpt_feature_title_icon' => [ 'value' => 'eicon-check', 'library' => 'eicons' ] ],
    [ '_id' => 'feat02', 'eael_mcpt_feature_title' => 'Cloud Storage',     'eael_mcpt_feature_title_icon' => [ 'value' => 'eicon-upload', 'library' => 'eicons' ] ],
    [ '_id' => 'feat03', 'eael_mcpt_feature_title' => 'Priority Support',  'eael_mcpt_feature_title_icon' => [ 'value' => 'eicon-support', 'library' => 'eicons' ] ],
    [ '_id' => 'feat04', 'eael_mcpt_feature_title' => 'Analytics Suite',   'eael_mcpt_feature_title_icon' => [ 'value' => 'eicon-chart-line', 'library' => 'eicons' ] ],
];

$widgets = [

    // ========================================================================
    // Layouts
    // ========================================================================

    ea_heading( '- Layouts -', 'h2' ),

    ea_heading( 'Default Multicolumn Pricing Table (Retro Layout)' ),
    ea_widget( 'test-mpt-default', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'retro-layout',
        'eael_mcpt_package_title_tag'   => 'h2',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => $default_packages,
    ] ),

    ea_heading( 'Multicolumn Pricing Table | Modern Layout' ),
    ea_widget( 'test-mpt-modern', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'modern-layout',
        'eael_mcpt_package_title_tag'   => 'h2',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_title_icon_position' => 'left',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => $default_packages,
    ] ),

    // ========================================================================
    // Featured badge
    // ========================================================================

    ea_heading( '- Featured Badge -', 'h2' ),

    ea_heading( 'Multicolumn Pricing Table | Featured Package (Bronze)' ),
    ea_widget( 'test-mpt-featured', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'retro-layout',
        'eael_mcpt_package_title_tag'   => 'h2',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => [
            [
                '_id'                                => 'pack11',
                'eael_mcpt_package_title'            => 'Silver',
                'eael_mcpt_package_is_featured'      => '',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 9,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => 'yes',
                'eael_mcpt_package_button_text'      => 'Get Silver',
                'eael_mcpt_package_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
            [
                '_id'                                => 'pack12',
                'eael_mcpt_package_title'            => 'Bronze',
                'eael_mcpt_package_is_featured'      => 'yes',
                'eael_mcpt_featured_badge_text'      => 'Best Value',
                'eael_mcpt_featured_badge_icon'      => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
                'eael_mcpt_featured_badge_icon_position' => 'left',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 19,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => 'yes',
                'eael_mcpt_package_button_text'      => 'Get Bronze',
                'eael_mcpt_package_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
            [
                '_id'                                => 'pack13',
                'eael_mcpt_package_title'            => 'Gold',
                'eael_mcpt_package_is_featured'      => '',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 29,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => 'yes',
                'eael_mcpt_package_button_text'      => 'Get Gold',
                'eael_mcpt_package_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
        ],
    ] ),

    // ========================================================================
    // Collapse feature rows
    // ========================================================================

    ea_heading( '- Collapse Feature -', 'h2' ),

    ea_heading( 'Multicolumn Pricing Table | Collapse Enabled (2 rows)' ),
    ea_widget( 'test-mpt-collapse', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'                        => 'retro-layout',
        'eael_mcpt_package_title_tag'             => 'h2',
        'eael_mcpt_package_title_effect'          => 'no',
        'eael_mcpt_collaps_feature'               => 'yes',
        'eael_mcpt_collaps_feature_rows'          => 2,
        'eael_mcpt_collaps_closed_label'          => 'See More',
        'eael_mcpt_collaps_expanded_label'        => 'See Less',
        'eael_mcpt_collaps_feature_icon_position' => 'left',
        'eael_mcpt_collaps_closed_icon'           => [ 'value' => 'eicon-angle-down', 'library' => 'eicons' ],
        'eael_mcpt_collaps_expanded_icon'         => [ 'value' => 'eicon-angle-up', 'library' => 'eicons' ],
        'eael_mcpt_icon_type'                     => 'text',
        'eael_mcpt_feature_titles'                => $default_features,
        'eael_mcpt_packages'                      => $default_packages,
    ] ),

    // ========================================================================
    // Sale price
    // ========================================================================

    ea_heading( '- Sale Price -', 'h2' ),

    ea_heading( 'Multicolumn Pricing Table | Sale Price on Gold' ),
    ea_widget( 'test-mpt-sale', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'retro-layout',
        'eael_mcpt_package_title_tag'   => 'h2',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => [
            [
                '_id'                                => 'pack21',
                'eael_mcpt_package_title'            => 'Silver',
                'eael_mcpt_package_is_featured'      => '',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 9,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => 'yes',
                'eael_mcpt_package_button_text'      => 'Get Silver',
                'eael_mcpt_package_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
            [
                '_id'                                => 'pack22',
                'eael_mcpt_package_title'            => 'Bronze',
                'eael_mcpt_package_is_featured'      => '',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 19,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => 'yes',
                'eael_mcpt_package_button_text'      => 'Get Bronze',
                'eael_mcpt_package_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
            [
                '_id'                                 => 'pack23',
                'eael_mcpt_package_title'             => 'Gold',
                'eael_mcpt_package_is_featured'       => '',
                'eael_mcpt_package_currency'          => '$',
                'eael_mcpt_package_currency_position' => 'left',
                'eael_mcpt_package_price'             => 49,
                'eael_mcpt_package_sale_price'        => 29,
                'eael_mcpt_package_sale_price_position' => 'after',
                'eael_mcpt_package_period'            => 'month',
                'eael_mcpt_package_period_separator'  => '/',
                'eael_mcpt_package_enable_button'     => 'yes',
                'eael_mcpt_package_button_text'       => 'Get Gold',
                'eael_mcpt_package_link'              => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
        ],
    ] ),

    // ========================================================================
    // Package title tag
    // ========================================================================

    ea_heading( '- Title Tag -', 'h2' ),

    ea_heading( 'Multicolumn Pricing Table | Title Tag H3' ),
    ea_widget( 'test-mpt-tag-h3', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'retro-layout',
        'eael_mcpt_package_title_tag'   => 'h3',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => $default_packages,
    ] ),

    // ========================================================================
    // Link behaviour
    // ========================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Multicolumn Pricing Table | External Link (target=_blank)' ),
    ea_widget( 'test-mpt-external', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'retro-layout',
        'eael_mcpt_package_title_tag'   => 'h2',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => [
            [
                '_id'                                => 'pack31',
                'eael_mcpt_package_title'            => 'External Plan',
                'eael_mcpt_package_is_featured'      => '',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 19,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => 'yes',
                'eael_mcpt_package_button_text'      => 'Buy Now',
                'eael_mcpt_package_link'             => [ 'url' => 'https://essential-addons.com', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
        ],
    ] ),

    ea_heading( 'Multicolumn Pricing Table | Nofollow Link' ),
    ea_widget( 'test-mpt-nofollow', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'retro-layout',
        'eael_mcpt_package_title_tag'   => 'h2',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => [
            [
                '_id'                                => 'pack41',
                'eael_mcpt_package_title'            => 'Nofollow Plan',
                'eael_mcpt_package_is_featured'      => '',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 19,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => 'yes',
                'eael_mcpt_package_button_text'      => 'Buy Now',
                'eael_mcpt_package_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ],
            ],
        ],
    ] ),

    // ========================================================================
    // Button disabled
    // ========================================================================

    ea_heading( '- Button Disabled -', 'h2' ),

    ea_heading( 'Multicolumn Pricing Table | Button Disabled' ),
    ea_widget( 'test-mpt-no-btn', 'eael-multicolumn-pricing-table', [
        'eael_mcpt_layout'              => 'retro-layout',
        'eael_mcpt_package_title_tag'   => 'h2',
        'eael_mcpt_package_title_effect'=> 'no',
        'eael_mcpt_collaps_feature'     => '',
        'eael_mcpt_icon_type'           => 'text',
        'eael_mcpt_feature_titles'      => $default_features,
        'eael_mcpt_packages'            => [
            [
                '_id'                                => 'pack51',
                'eael_mcpt_package_title'            => 'No Button Plan',
                'eael_mcpt_package_is_featured'      => '',
                'eael_mcpt_package_currency'         => '$',
                'eael_mcpt_package_currency_position'=> 'left',
                'eael_mcpt_package_price'            => 0,
                'eael_mcpt_package_sale_price'       => '',
                'eael_mcpt_package_period'           => 'month',
                'eael_mcpt_package_period_separator' => '/',
                'eael_mcpt_package_enable_button'    => '',
                'eael_mcpt_package_button_text'      => 'Buy Now',
                'eael_mcpt_package_link'             => [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
            ],
        ],
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

WP_CLI::success( 'Multicolumn Pricing Table page ready → /multicolumn-pricing-table/' );
