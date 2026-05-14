<?php
/**
 * Test page: Feature List
 * Run via: wp eval-file /scripts/setup-feature-list-page.php
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

// - Feature List page ---------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Feature List page ---' );

$slug    = getenv( 'FEATURE_LIST_PAGE_SLUG' ) ?: 'feature-list';
$page_id = ea_upsert_page( $slug, 'Feature List' );

$default_items = [
    [
        'eael_feature_list_icon_new'  => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
        'eael_feature_list_title'     => 'Feature Alpha',
        'eael_feature_list_content'   => 'Alpha feature description text.',
        'eael_feature_list_link'      => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ],
    [
        'eael_feature_list_icon_new'  => [ 'value' => 'eicon-check', 'library' => 'eicons' ],
        'eael_feature_list_title'     => 'Feature Beta',
        'eael_feature_list_content'   => 'Beta feature description text.',
        'eael_feature_list_link'      => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ],
    [
        'eael_feature_list_icon_new'  => [ 'value' => 'eicon-bolt', 'library' => 'eicons' ],
        'eael_feature_list_title'     => 'Feature Gamma',
        'eael_feature_list_content'   => 'Gamma feature description text.',
        'eael_feature_list_link'      => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
    ],
];

$widgets = [

    // ====================================================================
    // Layout & Position
    // ====================================================================

    ea_heading( '- Layout & Position -', 'h2' ),

    ea_heading( 'Default Feature List' ),
    ea_widget( 'test-fl-default', 'eael-feature-list',
        [
            'eael_feature_list'            => $default_items,
            'eael_feature_list_layout'     => 'vertical',
            'eael_feature_list_icon_position' => 'left',
            'eael_feature_list_icon_shape' => 'circle',
            'eael_feature_list_icon_shape_view' => 'stacked',
        ]
    ),

    ea_heading( 'Feature List | Layout: Horizontal' ),
    ea_widget( 'test-fl-layout-horizontal', 'eael-feature-list',
        [
            'eael_feature_list'            => $default_items,
            'eael_feature_list_layout'     => 'horizontal',
        ]
    ),

    // ====================================================================
    // Icon Position
    // ====================================================================

    ea_heading( '- Icon Position -', 'h2' ),

    ea_heading( 'Feature List | Icon: Top' ),
    ea_widget( 'test-fl-icon-top', 'eael-feature-list',
        [
            'eael_feature_list'               => $default_items,
            'eael_feature_list_icon_position' => 'top',
        ]
    ),

    ea_heading( 'Feature List | Icon: Right' ),
    ea_widget( 'test-fl-icon-right', 'eael-feature-list',
        [
            'eael_feature_list'               => $default_items,
            'eael_feature_list_icon_position' => 'right',
        ]
    ),

    // ====================================================================
    // Icon Shape
    // ====================================================================

    ea_heading( '- Icon Shape -', 'h2' ),

    ea_heading( 'Feature List | Shape: Square' ),
    ea_widget( 'test-fl-shape-square', 'eael-feature-list',
        [
            'eael_feature_list'            => $default_items,
            'eael_feature_list_icon_shape' => 'square',
        ]
    ),

    ea_heading( 'Feature List | Shape: Rhombus' ),
    ea_widget( 'test-fl-shape-rhombus', 'eael-feature-list',
        [
            'eael_feature_list'            => $default_items,
            'eael_feature_list_icon_shape' => 'rhombus',
        ]
    ),

    // ====================================================================
    // Shape View
    // ====================================================================

    ea_heading( '- Shape View -', 'h2' ),

    ea_heading( 'Feature List | View: Framed' ),
    ea_widget( 'test-fl-view-framed', 'eael-feature-list',
        [
            'eael_feature_list'                 => $default_items,
            'eael_feature_list_icon_shape_view' => 'framed',
        ]
    ),

    // ====================================================================
    // Connector
    // ====================================================================

    ea_heading( '- Connector -', 'h2' ),

    ea_heading( 'Feature List | Connector: Classic' ),
    ea_widget( 'test-fl-connector-classic', 'eael-feature-list',
        [
            'eael_feature_list'                  => $default_items,
            'eael_feature_list_connector'        => 'yes',
            'eael_feature_list_connector_type'   => 'connector-type-classic',
            'eael_feature_list_icon_position'    => 'left',
        ]
    ),

    ea_heading( 'Feature List | Connector: Modern' ),
    ea_widget( 'test-fl-connector-modern', 'eael-feature-list',
        [
            'eael_feature_list'               => $default_items,
            'eael_feature_list_connector'     => 'yes',
            'eael_feature_list_icon_position' => 'top',
        ]
    ),

    // ====================================================================
    // Icon Type: Image
    // ====================================================================

    ea_heading( '- Icon Type -', 'h2' ),

    ea_heading( 'Feature List | Icon Type: Image' ),
    ea_widget( 'test-fl-icon-image', 'eael-feature-list',
        [
            'eael_feature_list' => [
                [
                    'eael_feature_list_icon_type'  => 'image',
                    'eael_feature_list_img'        => [ 'url' => 'https://via.placeholder.com/60', 'id' => 0 ],
                    'eael_feature_list_title'      => 'Image Feature Alpha',
                    'eael_feature_list_content'    => 'Alpha with image icon.',
                    'eael_feature_list_link'       => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
                ],
                [
                    'eael_feature_list_icon_type'  => 'image',
                    'eael_feature_list_img'        => [ 'url' => 'https://via.placeholder.com/60', 'id' => 0 ],
                    'eael_feature_list_title'      => 'Image Feature Beta',
                    'eael_feature_list_content'    => 'Beta with image icon.',
                    'eael_feature_list_link'       => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
                ],
            ],
        ]
    ),

    // ====================================================================
    // Link Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Feature List | External Link (target=_blank)' ),
    ea_widget( 'test-fl-link-external', 'eael-feature-list',
        [
            'eael_feature_list' => [
                [
                    'eael_feature_list_icon_new'  => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
                    'eael_feature_list_title'     => 'External Link Feature',
                    'eael_feature_list_content'   => 'Opens in new tab.',
                    'eael_feature_list_link'      => [ 'url' => 'https://essential-addons.com', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ],
                ],
                [
                    'eael_feature_list_icon_new'  => [ 'value' => 'eicon-check', 'library' => 'eicons' ],
                    'eael_feature_list_title'     => 'External Link Feature 2',
                    'eael_feature_list_content'   => 'Also opens in new tab.',
                    'eael_feature_list_link'      => [ 'url' => 'https://essential-addons.com', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ],
                ],
            ],
        ]
    ),

    ea_heading( 'Feature List | Nofollow Link' ),
    ea_widget( 'test-fl-link-nofollow', 'eael-feature-list',
        [
            'eael_feature_list' => [
                [
                    'eael_feature_list_icon_new'  => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
                    'eael_feature_list_title'     => 'Nofollow Feature',
                    'eael_feature_list_content'   => 'Has nofollow rel.',
                    'eael_feature_list_link'      => [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ],
                ],
                [
                    'eael_feature_list_icon_new'  => [ 'value' => 'eicon-check', 'library' => 'eicons' ],
                    'eael_feature_list_title'     => 'Nofollow Feature 2',
                    'eael_feature_list_content'   => 'Also has nofollow.',
                    'eael_feature_list_link'      => [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ],
                ],
            ],
        ]
    ),

    // ====================================================================
    // Title HTML Tag
    // ====================================================================

    ea_heading( '- Title Tag -', 'h2' ),

    ea_heading( 'Feature List | Title Tag: H3' ),
    ea_widget( 'test-fl-title-tag-h3', 'eael-feature-list',
        [
            'eael_feature_list'            => $default_items,
            'eael_feature_list_title_size' => 'h3',
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

WP_CLI::success( 'Feature List page ready → /' . $slug . '/' );
