<?php
/**
 * Test page: Code Snippet
 * Run via: wp eval-file /scripts/setup-code-snippet-page.php
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

// ── Code Snippet page ──────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Code Snippet page ---' );

$slug    = getenv( 'CODE_SNIPPET_PAGE_SLUG' ) ?: 'code-snippet';
$page_id = ea_upsert_page( $slug, 'Code Snippet' );

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Theme Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Theme Variants ──', 'h2' ),

    ea_heading( 'Default Code Snippet' ),
    ea_widget( 'test-cs-default', 'eael-code-snippet',
        [
            'code_content' => '<div>Hello World</div>',
            'file_name'    => 'hello',
        ]
    ),

    ea_heading( 'Code Snippet | Theme: Dark' ),
    ea_widget( 'test-cs-dark', 'eael-code-snippet',
        [
            'theme'        => 'dark',
            'code_content' => '<p>Dark theme active</p>',
            'file_name'    => 'dark',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Language Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Language Variants ──', 'h2' ),

    ea_heading( 'Code Snippet | Language: PHP' ),
    ea_widget( 'test-cs-php', 'eael-code-snippet',
        [
            'language'     => 'php',
            'code_content' => "<?php echo 'Hello from PHP!'; ?>",
            'file_name'    => 'index',
        ]
    ),

    ea_heading( 'Code Snippet | Language: JavaScript' ),
    ea_widget( 'test-cs-js', 'eael-code-snippet',
        [
            'language'     => 'js',
            'code_content' => "console.log('Hello from JS!');",
            'file_name'    => 'app',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // View Modes
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── View Modes ──', 'h2' ),

    ea_heading( 'Code Snippet | View: Fixed' ),
    ea_widget( 'test-cs-fixed', 'eael-code-snippet',
        [
            'code_view_mode'     => 'fixed',
            'code_snippet_height' => [ 'unit' => 'px', 'size' => 200 ],
            'code_content'       => 'Line one\nLine two\nLine three',
            'file_name'          => 'fixed',
        ]
    ),

    ea_heading( 'Code Snippet | View: Collapsed' ),
    ea_widget( 'test-cs-collapsed', 'eael-code-snippet',
        [
            'code_view_mode' => 'collapsed',
            'code_content'   => 'function greet() {\n  return result;\n}',
            'file_name'      => 'collapsed',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Header & Copy Button
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Header & Copy Button ──', 'h2' ),

    ea_heading( 'Code Snippet | Header: Hidden' ),
    ea_widget( 'test-cs-no-header', 'eael-code-snippet',
        [
            'show_header'  => '',
            'code_content' => '<span>No header snippet</span>',
        ]
    ),

    ea_heading( 'Code Snippet | Copy Button: Hidden' ),
    ea_widget( 'test-cs-no-copy', 'eael-code-snippet',
        [
            'show_copy_button' => '',
            'code_content'     => '<em>No copy button here</em>',
            'file_name'        => 'nocopy',
        ]
    ),

    ea_heading( 'Code Snippet | Copy Tooltip: On' ),
    ea_widget( 'test-cs-tooltip', 'eael-code-snippet',
        [
            'show_copy_tooltip' => 'yes',
            'code_content'      => '<button>Copy me</button>',
            'file_name'         => 'tooltip',
        ]
    ),

    // ══════════════════════════════════════════════════════════════════════
    // Line Numbers
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Line Numbers ──', 'h2' ),

    ea_heading( 'Code Snippet | Line Numbers: On' ),
    ea_widget( 'test-cs-line-numbers', 'eael-code-snippet',
        [
            'show_line_numbers' => 'yes',
            'code_content'      => 'Alpha line\nBeta line\nGamma line',
            'file_name'         => 'numbered',
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

WP_CLI::success( 'Code Snippet page ready → /code-snippet/' );
