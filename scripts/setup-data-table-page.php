<?php
/**
 * Test page: Data Table
 * Run via: wp eval-file /scripts/setup-data-table-page.php
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

// - Data Table page ----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Data Table page ---' );

$slug    = getenv( 'DATA_TABLE_PAGE_SLUG' ) ?: 'data-table';
$page_id = ea_upsert_page( $slug, 'Data Table' );

// Reusable header columns: Name / Role / Status
$base_headers = [
    [ 'eael_data_table_header_col' => 'Name',   'eael_data_table_header_col_icon_enabled' => 'false' ],
    [ 'eael_data_table_header_col' => 'Role',   'eael_data_table_header_col_icon_enabled' => 'false' ],
    [ 'eael_data_table_header_col' => 'Status', 'eael_data_table_header_col_icon_enabled' => 'false' ],
];

// Reusable 2-row body with verifiable cell text
$base_rows = [
    [ 'eael_data_table_content_row_type' => 'row' ],
    [ 'eael_data_table_content_row_type' => 'col', 'eael_data_table_content_type' => 'textarea',
      'eael_data_table_content_row_title' => 'Alice', 'eael_data_table_content_row_colspan' => 1, 'eael_data_table_content_row_rowspan' => 1 ],
    [ 'eael_data_table_content_row_type' => 'col', 'eael_data_table_content_type' => 'textarea',
      'eael_data_table_content_row_title' => 'Developer', 'eael_data_table_content_row_colspan' => 1, 'eael_data_table_content_row_rowspan' => 1 ],
    [ 'eael_data_table_content_row_type' => 'col', 'eael_data_table_content_type' => 'textarea',
      'eael_data_table_content_row_title' => 'Active', 'eael_data_table_content_row_colspan' => 1, 'eael_data_table_content_row_rowspan' => 1 ],
    [ 'eael_data_table_content_row_type' => 'row' ],
    [ 'eael_data_table_content_row_type' => 'col', 'eael_data_table_content_type' => 'textarea',
      'eael_data_table_content_row_title' => 'Bob', 'eael_data_table_content_row_colspan' => 1, 'eael_data_table_content_row_rowspan' => 1 ],
    [ 'eael_data_table_content_row_type' => 'col', 'eael_data_table_content_type' => 'textarea',
      'eael_data_table_content_row_title' => 'Designer', 'eael_data_table_content_row_colspan' => 1, 'eael_data_table_content_row_rowspan' => 1 ],
    [ 'eael_data_table_content_row_type' => 'col', 'eael_data_table_content_type' => 'textarea',
      'eael_data_table_content_row_title' => 'Inactive', 'eael_data_table_content_row_colspan' => 1, 'eael_data_table_content_row_rowspan' => 1 ],
];

$widgets = [

    // ====================================================================
    // Alignment
    // ====================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'Default Data Table (Center Aligned)' ),
    ea_widget( 'test-dt-default', 'eael-data-table', [
        'eael_data_table_header_cols_data' => $base_headers,
        'eael_data_table_content_rows'     => $base_rows,
        'table_alignment'                  => 'center',
    ] ),

    ea_heading( 'Data Table | Alignment: Left' ),
    ea_widget( 'test-dt-align-left', 'eael-data-table', [
        'eael_data_table_header_cols_data' => $base_headers,
        'eael_data_table_content_rows'     => $base_rows,
        'table_alignment'                  => 'left',
    ] ),

    ea_heading( 'Data Table | Alignment: Right' ),
    ea_widget( 'test-dt-align-right', 'eael-data-table', [
        'eael_data_table_header_cols_data' => $base_headers,
        'eael_data_table_content_rows'     => $base_rows,
        'table_alignment'                  => 'right',
    ] ),

    // ====================================================================
    // Cell Content Types
    // ====================================================================

    ea_heading( '- Cell Content Types -', 'h2' ),

    ea_heading( 'Data Table | Cell: Icon Type' ),
    ea_widget( 'test-dt-icon-cell', 'eael-data-table', [
        'eael_data_table_header_cols_data' => [
            [ 'eael_data_table_header_col' => 'Type', 'eael_data_table_header_col_icon_enabled' => 'false' ],
            [ 'eael_data_table_header_col' => 'Value', 'eael_data_table_header_col_icon_enabled' => 'false' ],
        ],
        'eael_data_table_content_rows' => [
            [ 'eael_data_table_content_row_type' => 'row' ],
            [
                'eael_data_table_content_row_type' => 'col',
                'eael_data_table_content_type'     => 'icon',
                'eael_data_table_icon_content_new' => [ 'value' => 'eicon-check', 'library' => 'eicons' ],
                'eael_data_table_content_row_colspan' => 1,
                'eael_data_table_content_row_rowspan' => 1,
            ],
            [
                'eael_data_table_content_row_type'    => 'col',
                'eael_data_table_content_type'        => 'textarea',
                'eael_data_table_content_row_title'   => 'Verified',
                'eael_data_table_content_row_colspan' => 1,
                'eael_data_table_content_row_rowspan' => 1,
            ],
        ],
        'table_alignment' => 'center',
    ] ),

    ea_heading( 'Data Table | Cell: Linked Text' ),
    ea_widget( 'test-dt-link-cell', 'eael-data-table', [
        'eael_data_table_header_cols_data' => [
            [ 'eael_data_table_header_col' => 'Name', 'eael_data_table_header_col_icon_enabled' => 'false' ],
            [ 'eael_data_table_header_col' => 'Website', 'eael_data_table_header_col_icon_enabled' => 'false' ],
        ],
        'eael_data_table_content_rows' => [
            [ 'eael_data_table_content_row_type' => 'row' ],
            [
                'eael_data_table_content_row_type'    => 'col',
                'eael_data_table_content_type'        => 'textarea',
                'eael_data_table_content_row_title'   => 'EA Docs',
                'eael_data_table_content_row_colspan' => 1,
                'eael_data_table_content_row_rowspan' => 1,
            ],
            [
                'eael_data_table_content_row_type'    => 'col',
                'eael_data_table_content_type'        => 'textarea',
                'eael_data_table_content_row_title'   => 'Visit',
                'eael_data_table_content_row_title_link' => [
                    'url'         => '#',
                    'is_external' => '',
                    'nofollow'    => '',
                    'custom_attributes' => '',
                ],
                'eael_data_table_content_row_colspan' => 1,
                'eael_data_table_content_row_rowspan' => 1,
            ],
        ],
        'table_alignment' => 'center',
    ] ),

    // ====================================================================
    // Header Icon
    // ====================================================================

    ea_heading( '- Header Icon -', 'h2' ),

    ea_heading( 'Data Table | Header Icon Enabled' ),
    ea_widget( 'test-dt-header-icon', 'eael-data-table', [
        'eael_data_table_header_cols_data' => [
            [
                'eael_data_table_header_col'             => 'Name',
                'eael_data_table_header_col_icon_enabled' => 'true',
                'eael_data_table_header_icon_type'        => 'icon',
                'eael_data_table_header_col_icon_new'     => [ 'value' => 'eicon-person', 'library' => 'eicons' ],
            ],
            [
                'eael_data_table_header_col'             => 'Role',
                'eael_data_table_header_col_icon_enabled' => 'false',
            ],
        ],
        'eael_data_table_content_rows' => [
            [ 'eael_data_table_content_row_type' => 'row' ],
            [
                'eael_data_table_content_row_type'    => 'col',
                'eael_data_table_content_type'        => 'textarea',
                'eael_data_table_content_row_title'   => 'Charlie',
                'eael_data_table_content_row_colspan' => 1,
                'eael_data_table_content_row_rowspan' => 1,
            ],
            [
                'eael_data_table_content_row_type'    => 'col',
                'eael_data_table_content_type'        => 'textarea',
                'eael_data_table_content_row_title'   => 'Manager',
                'eael_data_table_content_row_colspan' => 1,
                'eael_data_table_content_row_rowspan' => 1,
            ],
        ],
        'table_alignment' => 'center',
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

WP_CLI::success( 'Data Table page ready → /' . $slug . '/' );
