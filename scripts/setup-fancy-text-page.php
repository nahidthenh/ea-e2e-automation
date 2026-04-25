<?php
/**
 * Test page: Fancy Text
 * Run via: wp eval-file /scripts/setup-fancy-text-page.php
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
            return (int) $existing->ID;
        }
        $id = wp_insert_post( [
            'post_type' => 'page', 'post_status' => 'publish',
            'post_title' => $title, 'post_name' => $slug,
        ], true );
        if ( is_wp_error( $id ) ) WP_CLI::error( $id->get_error_message() );
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

// ── Fancy Text page ────────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Fancy Text page ---' );

$slug    = getenv( 'FANCY_TEXT_PAGE_SLUG' ) ?: 'fancy-text';
$page_id = ea_upsert_page( $slug, 'Fancy Text' );

$default_strings = [
    [ 'eael_fancy_text_strings_text_field' => 'Alpha String' ],
    [ 'eael_fancy_text_strings_text_field' => 'Beta String' ],
    [ 'eael_fancy_text_strings_text_field' => 'Gamma String' ],
];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Animation Types
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Animation Types ──', 'h2' ),

    ea_heading( 'Default Fancy Text' ),
    ea_widget( 'test-ft-default', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'typing',
            'eael_fancy_text_alignment'       => 'center',
            'eael_fancy_text_loop'            => 'yes',
            'eael_fancy_text_cursor'          => 'yes',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Fade' ),
    ea_widget( 'test-ft-anim-fade', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'fadeIn',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Fade Up' ),
    ea_widget( 'test-ft-anim-fadeup', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'fadeInUp',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Fade Down' ),
    ea_widget( 'test-ft-anim-fadedown', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'fadeInDown',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Fade Left' ),
    ea_widget( 'test-ft-anim-fadeleft', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'fadeInLeft',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Fade Right' ),
    ea_widget( 'test-ft-anim-faderight', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'fadeInRight',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Zoom' ),
    ea_widget( 'test-ft-anim-zoom', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'zoomIn',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Bounce' ),
    ea_widget( 'test-ft-anim-bounce', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'bounceIn',
        ]
    ),

    ea_heading( 'Fancy Text | Animation: Swing' ),
    ea_widget( 'test-ft-anim-swing', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'          => 'This is the ',
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_suffix'          => ' of the sentence.',
            'eael_fancy_text_transition_type' => 'swing',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Alignment
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Alignment ──', 'h2' ),

    ea_heading( 'Fancy Text | Align: Left' ),
    ea_widget( 'test-ft-align-left', 'eael-fancy-text',
        [
            'eael_fancy_text_strings'   => $default_strings,
            'eael_fancy_text_alignment' => 'left',
        ]
    ),

    ea_heading( 'Fancy Text | Align: Right' ),
    ea_widget( 'test-ft-align-right', 'eael-fancy-text',
        [
            'eael_fancy_text_strings'   => $default_strings,
            'eael_fancy_text_alignment' => 'right',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Cursor / Loop toggles
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Cursor / Loop ──', 'h2' ),

    ea_heading( 'Fancy Text | Cursor: Off' ),
    ea_widget( 'test-ft-cursor-off', 'eael-fancy-text',
        [
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_transition_type' => 'typing',
            'eael_fancy_text_cursor'          => '',
        ]
    ),

    ea_heading( 'Fancy Text | Loop: Off' ),
    ea_widget( 'test-ft-loop-off', 'eael-fancy-text',
        [
            'eael_fancy_text_strings'         => $default_strings,
            'eael_fancy_text_transition_type' => 'typing',
            'eael_fancy_text_loop'            => '',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Animation start trigger
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Animation Start ──', 'h2' ),

    ea_heading( 'Fancy Text | Animation Start: View Port' ),
    ea_widget( 'test-ft-viewport', 'eael-fancy-text',
        [
            'eael_fancy_text_strings'              => $default_strings,
            'eael_fancy_text_animation_start_on'   => 'view_port',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Prefix / Suffix content
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Prefix / Suffix ──', 'h2' ),

    ea_heading( 'Fancy Text | Prefix Only (no suffix)' ),
    ea_widget( 'test-ft-prefix-only', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'  => 'Only Prefix: ',
            'eael_fancy_text_strings' => $default_strings,
            'eael_fancy_text_suffix'  => '',
        ]
    ),

    ea_heading( 'Fancy Text | Suffix Only (no prefix)' ),
    ea_widget( 'test-ft-suffix-only', 'eael-fancy-text',
        [
            'eael_fancy_text_prefix'  => '',
            'eael_fancy_text_strings' => $default_strings,
            'eael_fancy_text_suffix'  => ' : Only Suffix',
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

WP_CLI::success( 'Fancy Text page ready → /' . $slug . '/' );
