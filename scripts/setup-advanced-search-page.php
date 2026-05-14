<?php
/**
 * Test page: Advanced Search
 * Run via: wp eval-file /scripts/setup-advanced-search-page.php
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

// - Advanced Search page --------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Advanced Search page ---' );

$slug    = getenv( 'ADVANCED_SEARCH_PAGE_SLUG' ) ?: 'advanced-search';
$page_id = ea_upsert_page( $slug, 'Advanced Search' );

$widgets = [

    // ====================================================================
    // Form Layout Styles
    // ====================================================================

    ea_heading( '- Form Layout Styles -', 'h2' ),

    ea_heading( 'Default Advanced Search (Style 1)' ),
    ea_widget( 'test-as-default', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'yes',
            'search_field_placeholder_text' => 'Enter Search Keyword',
            'search_field_button_text'    => 'Search',
        ]
    ),

    ea_heading( 'Advanced Search | Form Style 2' ),
    ea_widget( 'test-as-style-2', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '2',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'yes',
            'search_field_placeholder_text' => 'Style 2 Search',
            'search_field_button_text'    => 'Search',
        ]
    ),

    ea_heading( 'Advanced Search | Form Style 3' ),
    ea_widget( 'test-as-style-3', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '3',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'yes',
            'search_field_placeholder_text' => 'Style 3 Search',
            'search_field_button_text'    => 'Search',
        ]
    ),

    // ====================================================================
    // Result Content Styles
    // ====================================================================

    ea_heading( '- Result Content Styles -', 'h2' ),

    ea_heading( 'Advanced Search | Content Style 2' ),
    ea_widget( 'test-as-result-2', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '2',
            'show_search_button'          => 'yes',
            'search_field_placeholder_text' => 'Result Style 2',
            'search_field_button_text'    => 'Search',
        ]
    ),

    ea_heading( 'Advanced Search | Content Style 3' ),
    ea_widget( 'test-as-result-3', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '3',
            'show_search_button'          => 'yes',
            'search_field_placeholder_text' => 'Result Style 3',
            'search_field_button_text'    => 'Search',
        ]
    ),

    // ====================================================================
    // Search Button Variants
    // ====================================================================

    ea_heading( '- Search Button Variants -', 'h2' ),

    ea_heading( 'Advanced Search | Button Hidden' ),
    ea_widget( 'test-as-btn-hidden', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'no',
            'search_field_placeholder_text' => 'Search without button',
        ]
    ),

    ea_heading( 'Advanced Search | Custom Button Text' ),
    ea_widget( 'test-as-btn-text', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'yes',
            'search_field_button_text'    => 'Find Now',
            'search_field_placeholder_text' => 'Custom button text',
        ]
    ),

    // ====================================================================
    // Category Dropdown
    // ====================================================================

    ea_heading( '- Category Dropdown -', 'h2' ),

    ea_heading( 'Advanced Search | Category List Shown' ),
    ea_widget( 'test-as-category-on', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'yes',
            'show_category_list'          => 'yes',
            'category_list_text'          => 'All Categories',
            'search_field_placeholder_text' => 'Search with categories',
            'search_field_button_text'    => 'Search',
        ]
    ),

    // ====================================================================
    // Link / Tab Behaviour
    // ====================================================================

    ea_heading( '- Link Behaviour -', 'h2' ),

    ea_heading( 'Advanced Search | Results Open in New Tab' ),
    ea_widget( 'test-as-new-tab', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'yes',
            'result_on_new_tab'           => 'yes',
            'search_field_placeholder_text' => 'Results open in new tab',
            'search_field_button_text'    => 'Search',
        ]
    ),

    // ====================================================================
    // Content Image Toggle
    // ====================================================================

    ea_heading( '- Content Image Toggle -', 'h2' ),

    ea_heading( 'Advanced Search | Image Hidden' ),
    ea_widget( 'test-as-no-image', 'eael-advanced-search',
        [
            'eael_adv_search_style'       => '1',
            'eael_adv_search_result'      => '1',
            'show_search_button'          => 'yes',
            'show_content_image'          => 'no',
            'search_field_placeholder_text' => 'No image in results',
            'search_field_button_text'    => 'Search',
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

WP_CLI::success( 'Advanced Search page ready → /advanced-search/' );
