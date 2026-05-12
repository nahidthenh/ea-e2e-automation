<?php
/**
 * Test page: Price Menu
 * Run via: wp eval-file /scripts/setup-price-menu-page.php
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

// - Price Menu page ------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Price Menu page ---' );

$slug    = getenv( 'PRICE_MENU_PAGE_SLUG' ) ?: 'price-menu';
$page_id = ea_upsert_page( $slug, 'Price Menu' );

// Reusable base items — two menu entries with distinct verifiable text.
$base_items = [
    [
        'menu_title'       => 'Espresso',
        'menu_description' => 'Rich bold coffee',
        'menu_price'       => '$3.50',
    ],
    [
        'menu_title'       => 'Cappuccino',
        'menu_description' => 'Espresso with steamed milk',
        'menu_price'       => '$4.50',
    ],
];

// Base item with a link on first entry (used for link tests).
$linked_items = [
    [
        'menu_title'       => 'Linked Item',
        'menu_description' => 'Has a link',
        'menu_price'       => '$5.00',
        'link'             => [
            'url'               => '#',
            'is_external'       => '',
            'nofollow'          => '',
            'custom_attributes' => '',
        ],
    ],
    [
        'menu_title'       => 'No Link Item',
        'menu_description' => 'No link here',
        'menu_price'       => '$4.00',
    ],
];

$external_items = [
    [
        'menu_title'       => 'External Item',
        'menu_description' => 'Opens in new tab',
        'menu_price'       => '$6.00',
        'link'             => [
            'url'               => 'https://essential-addons.com',
            'is_external'       => 'on',
            'nofollow'          => '',
            'custom_attributes' => '',
        ],
    ],
    [
        'menu_title'       => 'Regular Item',
        'menu_description' => 'No external link',
        'menu_price'       => '$4.00',
    ],
];

$widgets = [

    // ====================================================================
    // Menu Styles
    // ====================================================================

    ea_heading( '- Menu Styles -', 'h2' ),

    ea_heading( 'Default Price Menu (Style 1)' ),
    ea_widget( 'test-pm-default', 'eael-price-menu',
        [
            'menu_items' => $base_items,
        ]
    ),

    ea_heading( 'Price Menu | Style: EA Style' ),
    ea_widget( 'test-pm-style-eael', 'eael-price-menu',
        [
            'menu_style'  => 'style-eael',
            'menu_items'  => $base_items,
        ]
    ),

    ea_heading( 'Price Menu | Style: Style 2' ),
    ea_widget( 'test-pm-style-2', 'eael-price-menu',
        [
            'menu_style'  => 'style-2',
            'menu_items'  => $base_items,
        ]
    ),

    ea_heading( 'Price Menu | Style: Style 3' ),
    ea_widget( 'test-pm-style-3', 'eael-price-menu',
        [
            'menu_style'  => 'style-3',
            'menu_items'  => $base_items,
        ]
    ),

    ea_heading( 'Price Menu | Style: Style 4' ),
    ea_widget( 'test-pm-style-4', 'eael-price-menu',
        [
            'menu_style'  => 'style-4',
            'menu_items'  => $base_items,
        ]
    ),

    // ====================================================================
    // Discount & Pricing
    // ====================================================================

    ea_heading( '- Discount & Pricing -', 'h2' ),

    ea_heading( 'Price Menu | Discount on First Item' ),
    ea_widget( 'test-pm-discount', 'eael-price-menu',
        [
            'menu_items' => [
                [
                    'menu_title'       => 'Latte Special',
                    'menu_description' => 'Discounted today only',
                    'menu_price'       => '$3.99',
                    'discount'         => 'yes',
                    'original_price'   => '$5.99',
                ],
                [
                    'menu_title'       => 'Cold Brew',
                    'menu_description' => 'Regular price item',
                    'menu_price'       => '$4.50',
                ],
            ],
        ]
    ),

    // ====================================================================
    // Style-1 Features
    // ====================================================================

    ea_heading( '- Style-1 Features -', 'h2' ),

    ea_heading( 'Price Menu | Title-Price Connector' ),
    ea_widget( 'test-pm-connector', 'eael-price-menu',
        [
            'menu_items'             => $base_items,
            'title_price_connector'  => 'yes',
        ]
    ),

    ea_heading( 'Price Menu | Title Separator' ),
    ea_widget( 'test-pm-separator', 'eael-price-menu',
        [
            'menu_items'       => $base_items,
            'title_separator'  => 'yes',
        ]
    ),

    // ====================================================================
    // Link Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Price Menu | Link on Title' ),
    ea_widget( 'test-pm-link-title', 'eael-price-menu',
        [
            'menu_items'     => $linked_items,
            'link_apply_on'  => 'title',
        ]
    ),

    ea_heading( 'Price Menu | Link on Full Item' ),
    ea_widget( 'test-pm-link-full', 'eael-price-menu',
        [
            'menu_items'     => $linked_items,
            'link_apply_on'  => 'full_item',
        ]
    ),

    ea_heading( 'Price Menu | External Link (target=_blank)' ),
    ea_widget( 'test-pm-link-external', 'eael-price-menu',
        [
            'menu_items'     => $external_items,
            'link_apply_on'  => 'title',
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

WP_CLI::success( 'Price Menu page ready → /price-menu/' );
