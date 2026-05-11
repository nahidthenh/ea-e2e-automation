<?php
/**
 * Test page: Stacked Cards
 * Run via: wp eval-file /scripts/setup-stacked-cards-page.php
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

// ── Stacked Cards page ─────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Stacked Cards page ---' );

$slug    = getenv( 'STACKED_CARDS_PAGE_SLUG' ) ?: 'stacked-cards';
$page_id = ea_upsert_page( $slug, 'Stacked Cards' );

// Base card factory — content only, no media, to keep rendering unconditional.
function sc_card( string $title, string $content, string $bg ): array {
    return [
        'eael_stacked_card_content_type'             => 'content',
        'eael_stacked_card_item_title'               => $title,
        'eael_stacked_card_item_title_tag'           => 'h2',
        'eael_stacked_card_list_type'                => 'none',
        'eael_stacked_card_list_direction'           => 'row',
        'eael_stacked_card_item_content_media'       => 'none',
        'eael_stacked_card_item_content'             => $content,
        'eael_stacked_card_item_content_show_button' => 'no',
        'eael_stacked_card_bg_color'                 => $bg,
    ];
}

$default_cards = [
    sc_card( 'Alpha Card', 'Alpha card body text for testing.',  'rgba(250,236,188,1)' ),
    sc_card( 'Beta Card',  'Beta card body text for testing.',   'rgba(196,252,221,1)' ),
    sc_card( 'Gamma Card', 'Gamma card body text for testing.',  'rgba(215,215,251,1)' ),
];

// Cards with Read More button enabled.
$button_cards = array_map( function( $c ) {
    $c['eael_stacked_card_item_content_show_button'] = 'yes';
    $c['eael_stacked_card_item_content_button_text'] = 'Read More';
    $c['eael_stacked_card_item_content_button_link'] = [
        'url' => '#', 'is_external' => false, 'nofollow' => true,
    ];
    return $c;
}, $default_cards );

// Cards with icon media type.
$icon_cards = [
    array_merge( sc_card( 'Alpha Card', 'Alpha icon card.', 'rgba(250,236,188,1)' ), [
        'eael_stacked_card_list_type' => 'icon',
        'eael_stacked_card_icon'      => [ 'value' => 'eicon-star', 'library' => 'eicons' ],
    ] ),
    array_merge( sc_card( 'Beta Card', 'Beta icon card.', 'rgba(196,252,221,1)' ), [
        'eael_stacked_card_list_type' => 'icon',
        'eael_stacked_card_icon'      => [ 'value' => 'eicon-heart', 'library' => 'eicons' ],
    ] ),
    array_merge( sc_card( 'Gamma Card', 'Gamma icon card.', 'rgba(215,215,251,1)' ), [
        'eael_stacked_card_list_type' => 'icon',
        'eael_stacked_card_icon'      => [ 'value' => 'eicon-check', 'library' => 'eicons' ],
    ] ),
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Card Style (Vertical / Horizontal)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Card Style ──', 'h2' ),

    ea_heading( 'Default Stacked Cards (Vertical)' ),
    ea_widget( 'test-sc-default', 'eael-stacked-cards',
        [
            'eael_stacked_card_style'     => 'vertical',
            'eael_stacked_card_transform' => 'translate',
            'eael_stacked_card_list'      => $default_cards,
        ]
    ),

    ea_heading( 'Stacked Cards | Horizontal Style' ),
    ea_widget( 'test-sc-horizontal', 'eael-stacked-cards',
        [
            'eael_stacked_card_style'     => 'horizontal',
            'eael_stacked_card_transform' => 'translate',
            'eael_stacked_card_list'      => $default_cards,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Transform Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Transform Variants ──', 'h2' ),

    ea_heading( 'Stacked Cards | Transform: None' ),
    ea_widget( 'test-sc-transform-none', 'eael-stacked-cards',
        [
            'eael_stacked_card_style'     => 'vertical',
            'eael_stacked_card_transform' => 'none',
            'eael_stacked_card_list'      => $default_cards,
        ]
    ),

    ea_heading( 'Stacked Cards | Transform: Rotate' ),
    ea_widget( 'test-sc-transform-rotate', 'eael-stacked-cards',
        [
            'eael_stacked_card_style'     => 'vertical',
            'eael_stacked_card_transform' => 'rotate',
            'eael_stacked_card_rotation'  => [ 'size' => 6 ],
            'eael_stacked_card_list'      => $default_cards,
        ]
    ),

    ea_heading( 'Stacked Cards | Transform: Scale' ),
    ea_widget( 'test-sc-transform-scale', 'eael-stacked-cards',
        [
            'eael_stacked_card_style'     => 'vertical',
            'eael_stacked_card_transform' => 'scale',
            'eael_stacked_card_scale'     => [ 'size' => 10 ],
            'eael_stacked_card_list'      => $default_cards,
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Variants ──', 'h2' ),

    ea_heading( 'Stacked Cards | With Read More Button' ),
    ea_widget( 'test-sc-with-button', 'eael-stacked-cards',
        [
            'eael_stacked_card_style'     => 'vertical',
            'eael_stacked_card_transform' => 'translate',
            'eael_stacked_card_list'      => $button_cards,
        ]
    ),

    ea_heading( 'Stacked Cards | Media Type: Icon' ),
    ea_widget( 'test-sc-media-icon', 'eael-stacked-cards',
        [
            'eael_stacked_card_style'     => 'vertical',
            'eael_stacked_card_transform' => 'translate',
            'eael_stacked_card_list'      => $icon_cards,
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

WP_CLI::success( 'Stacked Cards page ready → /' . $slug . '/' );
