<?php
/**
 * Branch test page: Table of Content - 72356
 * Issue (fbs-72356): Auto-highlight color selectable, word-wrap max line width,
 *                    and TOC Scroll Sync (auto-scroll active item into view).
 * Run via: wp eval-file /scripts/setup-table-of-content-branch-test.php
 *
 * NOTE: TOC is an Elementor *page-level extension* (not a widget). It is
 * configured via _elementor_page_settings, then injected into the page by
 * Essential_Addons_Elementor\Traits\Elements. The page below contains many
 * H2/H3 headings with long titles + filler so all three improvements can be
 * exercised in one scroll.
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
if ( ! function_exists( 'ea_text' ) ) {
    function ea_text( string $html ): array {
        return [
            'id' => ea_make_id(), 'elType' => 'widget', 'widgetType' => 'text-editor',
            'settings' => [ 'editor' => $html ],
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

// ── Table of Content branch test (72356) ──────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Table of Content Branch Test (72356) ---' );

$slug    = getenv( 'TABLE_OF_CONTENT_PAGE_SLUG' ) ?: 'table-of-content-branch-test';
$page_id = ea_upsert_page( $slug, 'Table of Content (Branch Test 72356)' );

$lorem_short = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>';
$lorem_long  = $lorem_short . '<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.</p><p>Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.</p>';

$widgets = [

    ea_heading( 'Branch 72356 – TOC Improvements', 'h1' ),
    ea_text( '<p><strong>What this page exercises:</strong></p><ul>'
        . '<li><strong>(1) Auto-highlight color</strong> — set to <code>#0066cc</code> instead of hardcoded <code>#ff7d50</code>.</li>'
        . '<li><strong>(2) Stop-word-wrap max line width</strong> — slider set to <code>400px</code> (was hardcoded <code>140px</code>).</li>'
        . '<li><strong>(3) TOC Scroll Sync</strong> — TOC body auto-scrolls so the active heading stays visible.</li>'
        . '<li><strong>(bonus) Main page offset</strong> — default changed from 0 → 120 and clamped to [5, 2000].</li>'
        . '</ul><p>Scroll down to trigger highlight + scroll-sync. The TOC panel is on the left at desktop.</p>' ),

    // ══════════════════════════════════════════════════════════════════════
    // Long heading titles → exercises word-wrap max-width control
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( 'Section 1: Introduction to the Comprehensive Long-Form Documentation', 'h2' ),
    ea_text( $lorem_long ),
    ea_heading( 'Subsection 1.1: Why a Single-Color Auto-Highlight Was Insufficient for Branded Sites', 'h3' ),
    ea_text( $lorem_short ),
    ea_heading( 'Subsection 1.2: Word Wrap Truncation Issues With Wide Sidebars and Long Titles', 'h3' ),
    ea_text( $lorem_short ),

    ea_heading( 'Section 2: A Very Long Heading That Demonstrates Stop-Word-Wrap Behavior in Real Content', 'h2' ),
    ea_text( $lorem_long ),
    ea_heading( 'Subsection 2.1: How Scroll Sync Keeps the Active Heading Visible Inside the TOC Body', 'h3' ),
    ea_text( $lorem_short ),
    ea_heading( 'Subsection 2.2: Page Offset Clamping Between Five and Two Thousand Pixels', 'h3' ),
    ea_text( $lorem_short ),

    ea_heading( 'Section 3: Auto-Highlight Activation Threshold Calculation With New Algorithm', 'h2' ),
    ea_text( $lorem_long ),
    ea_heading( 'Subsection 3.1: Replacing the Viewport-Bounds Detection With Scroll-Top Comparison', 'h3' ),
    ea_text( $lorem_short ),
    ea_heading( 'Subsection 3.2: Parent Highlight Class Propagation Through Nested List Ancestors', 'h3' ),
    ea_text( $lorem_short ),

    ea_heading( 'Section 4: Scroll Sync Smooth-Behavior Animation and Ten-Pixel Top Offset', 'h2' ),
    ea_text( $lorem_long ),
    ea_heading( 'Subsection 4.1: Why eaelTocActiveHref Caching Prevents Redundant Scroll Animations', 'h3' ),
    ea_text( $lorem_short ),
    ea_heading( 'Subsection 4.2: Single-Item Highlight Mode Combined With Scroll-Sync Behavior', 'h3' ),
    ea_text( $lorem_short ),

    ea_heading( 'Section 5: TOC Style Class Composition With Eael-Toc-Scroll-Sync Modifier', 'h2' ),
    ea_text( $lorem_long ),
    ea_heading( 'Subsection 5.1: Editor Preview Render Path Through src/js/edit/table-of-content.js', 'h3' ),
    ea_text( $lorem_short ),
    ea_heading( 'Subsection 5.2: SCSS Selector Change From First-Child-Only to All Active Links', 'h3' ),
    ea_text( $lorem_short ),

    ea_heading( 'Section 6: Final Section to Ensure TOC List Overflows the Max-Height Container', 'h2' ),
    ea_text( $lorem_long ),
    ea_heading( 'Subsection 6.1: Manual Verification of Color Selector Default Value 0066cc', 'h3' ),
    ea_text( $lorem_short ),
    ea_heading( 'Subsection 6.2: Final Subsection For Scroll Sync End-of-Page Behaviour', 'h3' ),
    ea_text( $lorem_long ),

];

ea_save_elementor_data( $page_id, $widgets );

// ── Configure page-level TOC settings ──────────────────────────────────────
// Must include every key the trait reads without isset/empty guards, plus
// the THREE new keys this branch introduces.

$page_settings = [
    'eael_ext_table_of_content'                       => 'yes',

    // Layout / scoping
    'eael_ext_toc_title'                              => 'Table of Contents',
    'eael_ext_toc_title_tag'                          => 'h2',
    'eael_ext_toc_supported_heading_tag'              => [ 'h2', 'h3' ],
    'eael_ext_toc_content_selector'                   => '',
    'eael_toc_exclude_selector'                       => '',
    'eael_ext_toc_collapse_sub_heading'               => 'no',
    'eael_ext_toc_use_title_in_url'                   => 'no',
    'eael_ext_toc_list_icon'                          => 'bullet',
    'eael_ext_table_of_content_list_style'            => 'none',

    // Positioning
    'eael_ext_toc_position'                           => 'left',
    'eael_ext_toc_position_mobile'                    => 'no',
    'eael_ext_toc_main_page_offset'                   => [ 'unit' => 'px', 'size' => 120, 'sizes' => [] ], // NEW default 120 (was 0)
    'eael_ext_toc_sticky_scroll'                      => 'no',
    'eael_ext_toc_hide_in_mobile'                     => 'no',

    // Header / icon (unguarded reads)
    'eael_ext_table_of_content_header_icon'           => [ 'value' => 'fas fa-list', 'library' => 'fa-solid' ],
    'eael_ext_toc_close_button_text_style'            => '',

    // ── Improvement #1: word-wrap + selectable max line width ─────────────
    'eael_ext_toc_word_wrap'                          => 'yes',
    'eael_ext_toc_word_wrap_max_width'                => [ 'unit' => 'px', 'size' => 400, 'sizes' => [] ], // NEW control

    // Auto-highlight (#2 + #3 are gated on this)
    'eael_ext_toc_auto_collapse'                      => 'no',
    'eael_ext_toc_auto_highlight'                     => 'yes',
    'eael_ext_toc_auto_highlight_single_item_only'    => 'no',

    // ── Improvement #2: selectable auto-highlight colour ──────────────────
    'eael_ext_toc_auto_highlight_color'               => '#0066cc',   // NEW control (default was #ff7d50)

    // ── Improvement #3: TOC scroll sync ───────────────────────────────────
    'eael_ext_toc_scroll_sync'                        => 'yes',       // NEW control
];

update_post_meta( $page_id, '_elementor_page_settings', $page_settings );

WP_CLI::log( '  widgets : ' . count( $widgets ) . ' nodes written (headings + filler text)' );
WP_CLI::log( '  toc-set : eael_ext_table_of_content=yes, auto_highlight_color=#0066cc, word_wrap_max_width=400px, scroll_sync=yes' );

if ( class_exists( '\Elementor\Core\Files\CSS\Post' ) ) {
    ( new \Elementor\Core\Files\CSS\Post( $page_id ) )->update_file();
    WP_CLI::log( '  CSS     : Elementor CSS regenerated for page ' . $page_id );
} elseif ( class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->files_manager ) ) {
    \Elementor\Plugin::$instance->files_manager->clear_cache();
    WP_CLI::log( '  CSS     : cache cleared' );
}

WP_CLI::success( 'Table of Content branch test page ready → /' . $slug . '/' );
