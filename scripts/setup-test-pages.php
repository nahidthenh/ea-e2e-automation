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
 * Build an Elementor core heading widget — used as a visual label above each
 * button variant so the test page is easy to read in a browser.
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

    // ── free effects ─────────────────────────────────────────────────────────

    ea_heading( 'Default Button', 'h3' ),
    ea_widget( 'test-cb-default', 'eael-creative-button',
        cb_base( 'eael-creative-button--default' )
    ),

    ea_heading( 'Effect — Winona' ),
    ea_widget( 'test-cb-winona', 'eael-creative-button',
        cb_base( 'eael-creative-button--winona' )
    ),

    ea_heading( 'Effect — Ujarak' ),
    ea_widget( 'test-cb-ujarak', 'eael-creative-button',
        cb_base( 'eael-creative-button--ujarak' )
    ),

    ea_heading( 'Effect — Wayra' ),
    ea_widget( 'test-cb-wayra', 'eael-creative-button',
        cb_base( 'eael-creative-button--wayra' )
    ),

    // Tamaya is special: renders explicit before/after DOM nodes for secondary text
    ea_heading( 'Effect — Tamaya' ),
    ea_widget( 'test-cb-tamaya', 'eael-creative-button',
        cb_base( 'eael-creative-button--tamaya' )
    ),

    ea_heading( 'Effect — Rayen' ),
    ea_widget( 'test-cb-rayen', 'eael-creative-button',
        cb_base( 'eael-creative-button--rayen' )
    ),

    // ── pro effects ───────────────────────────────────────────────────────────

    ea_heading( 'Pro — Pipaluk', 'h3' ),
    ea_widget( 'test-cb-pipaluk', 'eael-creative-button',
        cb_base( 'eael-creative-button--pipaluk' )
    ),

    ea_heading( 'Pro — Moema' ),
    ea_widget( 'test-cb-moema', 'eael-creative-button',
        cb_base( 'eael-creative-button--moema' )
    ),

    ea_heading( 'Pro — Wave' ),
    ea_widget( 'test-cb-wave', 'eael-creative-button',
        cb_base( 'eael-creative-button--wave' )
    ),

    ea_heading( 'Pro — Aylen' ),
    ea_widget( 'test-cb-aylen', 'eael-creative-button',
        cb_base( 'eael-creative-button--aylen' )
    ),

    ea_heading( 'Pro — Saqui' ),
    ea_widget( 'test-cb-saqui', 'eael-creative-button',
        cb_base( 'eael-creative-button--saqui' )
    ),

    ea_heading( 'Pro — Wapasha' ),
    ea_widget( 'test-cb-wapasha', 'eael-creative-button',
        cb_base( 'eael-creative-button--wapasha' )
    ),

    ea_heading( 'Pro — Nuka' ),
    ea_widget( 'test-cb-nuka', 'eael-creative-button',
        cb_base( 'eael-creative-button--nuka' )
    ),

    ea_heading( 'Pro — Antiman' ),
    ea_widget( 'test-cb-antiman', 'eael-creative-button',
        cb_base( 'eael-creative-button--antiman' )
    ),

    ea_heading( 'Pro — Quidel' ),
    ea_widget( 'test-cb-quidel', 'eael-creative-button',
        cb_base( 'eael-creative-button--quidel' )
    ),

    ea_heading( 'Pro — Shikoba' ),
    ea_widget( 'test-cb-shikoba', 'eael-creative-button',
        cb_base( 'eael-creative-button--shikoba' )
    ),

    // ── icon variants ─────────────────────────────────────────────────────────

    ea_heading( 'Icon Left', 'h3' ),
    ea_widget( 'test-cb-icon-left', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_icon_new'       => $ea_icon,
            'eael_creative_button_icon_alignment' => 'left',
        ] )
    ),

    ea_heading( 'Icon Right' ),
    ea_widget( 'test-cb-icon-right', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_icon_new'       => $ea_icon,
            'eael_creative_button_icon_alignment' => 'right',
        ] )
    ),

    // ── link behaviour ────────────────────────────────────────────────────────

    ea_heading( 'External Link', 'h3' ),
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

    ea_heading( 'Nofollow Link' ),
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

    // ── alignment ─────────────────────────────────────────────────────────────

    ea_heading( 'Align Left', 'h3' ),
    ea_widget( 'test-cb-align-left', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_alignment' => [
                'unit' => 'px', 'size' => '', 'sizes' => [],
            ],
            // justify-content: flex-start
            '__globals__' => [],
        ] )
    ),

    ea_heading( 'Align Center' ),
    ea_widget( 'test-cb-align-center', 'eael-creative-button',
        cb_base( 'eael-creative-button--default', [
            'eael_creative_button_alignment' => 'center',
        ] )
    ),

    ea_heading( 'Align Right' ),
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
