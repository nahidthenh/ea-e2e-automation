<?php
/**
 * Creates and configures Elementor test pages.
 * Run via: wp eval-file /scripts/setup-test-pages.php
 *
 * Each page is idempotent — re-running updates Elementor data without
 * creating duplicates.
 */

// ── helpers ───────────────────────────────────────────────────────────────────

function ea_make_id(): string {
    return substr( md5( uniqid( '', true ) ), 0, 8 );
}

function ea_upsert_page( string $slug, string $title ): int {
    $existing = get_page_by_path( $slug, OBJECT, 'page' );
    if ( $existing ) {
        WP_CLI::log( "  exists : {$title} (ID {$existing->ID})" );
        update_post_meta( (int) $existing->ID, '_wp_page_template', 'elementor-full-width' );
        return (int) $existing->ID;
    }

    $id = wp_insert_post( [
        'post_type'   => 'page',
        'post_status' => 'publish',
        'post_title'  => $title,
        'post_name'   => $slug,
    ], true );

    if ( is_wp_error( $id ) ) {
        WP_CLI::error( 'Failed to create "' . $slug . '": ' . $id->get_error_message() );
    }

    update_post_meta( $id, '_wp_page_template', 'elementor-full-width' );
    WP_CLI::log( "  created: {$title} (ID {$id})" );
    return (int) $id;
}

/**
 * Build a widget node. Use _css_classes to give each variant a stable
 * test hook (e.g. "test-cb-default") that tests can target with
 * `.test-cb-default .eael-creative-button`.
 */
function ea_widget( string $css_class, string $widget_type, array $settings ): array {
    return [
        'id'         => ea_make_id(),
        'elType'     => 'widget',
        'widgetType' => $widget_type,
        'settings'   => array_merge( [ '_css_classes' => $css_class ], $settings ),
        'elements'   => [],
    ];
}

/**
 * Build an Elementor core heading widget.
 *
 * @param string $title   Heading text — should describe what the widget below is testing.
 * @param string $tag     h2 for group banners, h4 for individual widget labels.
 */
function ea_heading( string $title, string $tag = 'h4' ): array {
    return [
        'id'         => ea_make_id(),
        'elType'     => 'widget',
        'widgetType' => 'heading',
        'settings'   => [
            'title'       => $title,
            'header_size' => $tag,
        ],
        'elements'   => [],
    ];
}

/**
 * Wrap a flat list of widgets in an Elementor section → column tree.
 */
function ea_build_elementor_data( array $widgets ): array {
    return [
        [
            'id'       => ea_make_id(),
            'elType'   => 'section',
            'isInner'  => false,
            'settings' => [],
            'elements' => [
                [
                    'id'       => ea_make_id(),
                    'elType'   => 'column',
                    'isInner'  => false,
                    'settings' => [ '_column_size' => 100 ],
                    'elements' => $widgets,
                ],
            ],
        ],
    ];
}

function ea_save_elementor_data( int $page_id, array $widgets ): void {
    $data = ea_build_elementor_data( $widgets );
    update_post_meta( $page_id, '_elementor_data', wp_json_encode( $data ) );
    update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
    update_post_meta( $page_id, '_elementor_version', '3.0.0' );
    delete_post_meta( $page_id, '_elementor_css' ); // force CSS regeneration
}

// ── shared base settings ──────────────────────────────────────────────────────

// Elementor's built-in eicons library is always registered on the frontend.
// Font Awesome 'fa-solid' gets normalized to empty by Elementor if the FA kit
// isn't loaded, which causes the icon condition to fail and strips alignment.
$ea_icon = [ 'value' => 'eicon-arrow-right', 'library' => 'eicons' ];
$no_icon = [ 'value' => '', 'library' => '' ];

function cb_base( string $effect, array $extra = [] ): array {
    return array_merge( [
        'creative_button_text'                => 'Click Me!',
        'creative_button_secondary_text'      => 'Go!',
        'creative_button_link_url'            => [
            'url'               => '#',
            'is_external'       => '',
            'nofollow'          => '',
            'custom_attributes' => '',
        ],
        'creative_button_effect'              => $effect,
        'eael_creative_button_icon_alignment' => 'left',
        'eael_creative_button_icon_new'       => [ 'value' => '', 'library' => '' ],
    ], $extra );
}

// ── Creative Button page ──────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Creative Button page ---' );

$slug    = getenv( 'CREATIVE_BUTTON_PAGE_SLUG' ) ?: 'creative-button';
$page_id = ea_upsert_page( $slug, 'Creative Button' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════════
    // Free Effects
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Free Effects ──', 'h2' ),

    ea_heading( 'Default Button' ),
    ea_widget( 'test-cb-default', 'eael-creative-button',
        cb_base( 'eael-creative-button--default' )
    ),

    ea_heading( 'Effect: Winona' ),
    ea_widget( 'test-cb-winona', 'eael-creative-button',
        cb_base( 'eael-creative-button--winona' )
    ),

    ea_heading( 'Effect: Ujarak' ),
    ea_widget( 'test-cb-ujarak', 'eael-creative-button',
        cb_base( 'eael-creative-button--ujarak' )
    ),

    ea_heading( 'Effect: Wayra' ),
    ea_widget( 'test-cb-wayra', 'eael-creative-button',
        cb_base( 'eael-creative-button--wayra' )
    ),

    // Tamaya is special: renders explicit before/after DOM nodes for secondary text
    ea_heading( 'Effect: Tamaya (renders before/after DOM nodes)' ),
    ea_widget( 'test-cb-tamaya', 'eael-creative-button',
        cb_base( 'eael-creative-button--tamaya' )
    ),

    ea_heading( 'Effect: Rayen' ),
    ea_widget( 'test-cb-rayen', 'eael-creative-button',
        cb_base( 'eael-creative-button--rayen' )
    ),

    // ══════════════════════════════════════════════════════════════════════════
    // Pro Effects
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Pro Effects ──', 'h2' ),

    ea_heading( 'Pro Effect: Pipaluk' ),
    ea_widget( 'test-cb-pipaluk', 'eael-creative-button',
        cb_base( 'eael-creative-button--pipaluk' )
    ),

    ea_heading( 'Pro Effect: Moema' ),
    ea_widget( 'test-cb-moema', 'eael-creative-button',
        cb_base( 'eael-creative-button--moema' )
    ),

    ea_heading( 'Pro Effect: Wave' ),
    ea_widget( 'test-cb-wave', 'eael-creative-button',
        cb_base( 'eael-creative-button--wave' )
    ),

    ea_heading( 'Pro Effect: Aylen' ),
    ea_widget( 'test-cb-aylen', 'eael-creative-button',
        cb_base( 'eael-creative-button--aylen' )
    ),

    ea_heading( 'Pro Effect: Saqui' ),
    ea_widget( 'test-cb-saqui', 'eael-creative-button',
        cb_base( 'eael-creative-button--saqui' )
    ),

    ea_heading( 'Pro Effect: Wapasha' ),
    ea_widget( 'test-cb-wapasha', 'eael-creative-button',
        cb_base( 'eael-creative-button--wapasha' )
    ),

    ea_heading( 'Pro Effect: Nuka' ),
    ea_widget( 'test-cb-nuka', 'eael-creative-button',
        cb_base( 'eael-creative-button--nuka' )
    ),

    ea_heading( 'Pro Effect: Antiman' ),
    ea_widget( 'test-cb-antiman', 'eael-creative-button',
        cb_base( 'eael-creative-button--antiman' )
    ),

    ea_heading( 'Pro Effect: Quidel' ),
    ea_widget( 'test-cb-quidel', 'eael-creative-button',
        cb_base( 'eael-creative-button--quidel' )
    ),

    ea_heading( 'Pro Effect: Shikoba' ),
    ea_widget( 'test-cb-shikoba', 'eael-creative-button',
        cb_base( 'eael-creative-button--shikoba' )
    ),

    // ══════════════════════════════════════════════════════════════════════════
    // Icon Variants
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Icon Variants ──', 'h2' ),

    ea_heading( 'Default Button | Icon Position: Left' ),
    ea_widget( 'test-cb-icon-left', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_icon_new'       => $ea_icon,
            'eael_creative_button_icon_alignment' => 'left',
        ] )
    ),

    ea_heading( 'Default Button | Icon Position: Right' ),
    ea_widget( 'test-cb-icon-right', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_icon_new'       => $ea_icon,
            'eael_creative_button_icon_alignment' => 'right',
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════════
    // Link Behaviour
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Link Behaviour ──', 'h2' ),

    ea_heading( 'Default Button | External Link (target=_blank)' ),
    ea_widget( 'test-cb-external', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'creative_button_link_url' => [
                'url'               => 'https://essential-addons.com',
                'is_external'       => 'on',
                'nofollow'          => '',
                'custom_attributes' => '',
            ],
        ] )
    ),

    ea_heading( 'Default Button | Nofollow Link (rel=nofollow)' ),
    ea_widget( 'test-cb-nofollow', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'creative_button_link_url' => [
                'url'               => 'https://essential-addons.com',
                'is_external'       => '',
                'nofollow'          => 'on',
                'custom_attributes' => '',
            ],
        ] )
    ),

    // ══════════════════════════════════════════════════════════════════════════
    // Button Alignment
    // ══════════════════════════════════════════════════════════════════════════

    ea_heading( '── Button Alignment ──', 'h2' ),

    ea_heading( 'Default Button | Align: Left (justify-content: flex-start)' ),
    ea_widget( 'test-cb-align-left', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_alignment' => [
                'unit' => 'px', 'size' => '', 'sizes' => [],
            ],
            '__globals__' => [],
        ] )
    ),

    ea_heading( 'Default Button | Align: Center (justify-content: center)' ),
    ea_widget( 'test-cb-align-center', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_alignment' => 'center',
        ] )
    ),

    ea_heading( 'Default Button | Align: Right (justify-content: flex-end)' ),
    ea_widget( 'test-cb-align-right', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_alignment' => 'flex-end',
        ] )
    ),

];

ea_save_elementor_data( $page_id, $widgets );

WP_CLI::log( '  widgets : ' . count( $widgets ) . ' nodes written (includes headings)' );

// Explicitly regenerate the Elementor CSS file for this page so that
// responsive-control selectors (e.g. justify-content for alignment) are
// written to disk before the E2E tests load the page.
if ( class_exists( '\Elementor\Core\Files\CSS\Post' ) ) {
    $css_file = new \Elementor\Core\Files\CSS\Post( $page_id );
    $css_file->update_file();
    WP_CLI::log( '  CSS     : Elementor CSS regenerated for page ' . $page_id );
} elseif ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->files_manager ) ) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    WP_CLI::log( '  CSS     : Elementor CSS cache cleared (all pages)' );
}

WP_CLI::success( "Creative Button page ready → /{$slug}/" );
