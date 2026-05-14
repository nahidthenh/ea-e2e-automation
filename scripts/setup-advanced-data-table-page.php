<?php
/**
 * Test page: Advanced Data Table
 * Run via: wp eval-file /scripts/setup-advanced-data-table-page.php
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
		update_post_meta( $page_id, '_elementor_data', wp_slash( wp_json_encode( $data ) ) );
		update_post_meta( $page_id, '_elementor_edit_mode', 'builder' );
		update_post_meta( $page_id, '_elementor_version', '3.0.0' );
		delete_post_meta( $page_id, '_elementor_css' );
	}
}

// - Advanced Data Table page -------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- Advanced Data Table page ---' );

$slug    = getenv( 'ADVANCED_DATA_TABLE_PAGE_SLUG' ) ?: 'advanced-data-table';
$page_id = ea_upsert_page( $slug, 'Advanced Data Table' );

// Reusable static HTML content — thead/tbody only (no <table> tag so it nests
// correctly inside the widget's own <table> element on the frontend).
$table_html = '<thead><tr><th>Name</th><th>Role</th><th>Department</th></tr></thead>'
	. '<tbody>'
	. '<tr><td>Alice Johnson</td><td>Developer</td><td>Engineering</td></tr>'
	. '<tr><td>Bob Martinez</td><td>Designer</td><td>Creative</td></tr>'
	. '<tr><td>Carol White</td><td>Manager</td><td>Operations</td></tr>'
	. '</tbody>';

$widgets = [

	// ====================================================================
	// Configurations
	// ====================================================================

	ea_heading( '- Advanced Data Table Configurations -', 'h2' ),

	ea_heading( 'Default Advanced Data Table (Sort + Search + Pagination)' ),
	ea_widget( 'test-adt-default', 'eael-advanced-data-table',
		[
			'ea_adv_data_table_source'          => 'static',
			'ea_adv_data_table_static_html'     => $table_html,
			'ea_adv_data_table_sort'            => 'yes',
			'ea_adv_data_table_search'          => 'yes',
			'ea_adv_data_table_pagination'      => 'yes',
			'ea_adv_data_table_pagination_type' => 'button',
			'ea_adv_data_table_items_per_page'  => 10,
		]
	),

	ea_heading( 'Advanced Data Table | Sort Off' ),
	ea_widget( 'test-adt-no-sort', 'eael-advanced-data-table',
		[
			'ea_adv_data_table_source'      => 'static',
			'ea_adv_data_table_static_html' => $table_html,
			'ea_adv_data_table_sort'        => '',
			'ea_adv_data_table_search'      => 'yes',
			'ea_adv_data_table_pagination'  => 'yes',
		]
	),

	ea_heading( 'Advanced Data Table | Search Off' ),
	ea_widget( 'test-adt-no-search', 'eael-advanced-data-table',
		[
			'ea_adv_data_table_source'      => 'static',
			'ea_adv_data_table_static_html' => $table_html,
			'ea_adv_data_table_sort'        => 'yes',
			'ea_adv_data_table_search'      => '',
			'ea_adv_data_table_pagination'  => 'yes',
		]
	),

	ea_heading( 'Advanced Data Table | Pagination Off' ),
	ea_widget( 'test-adt-no-pagination', 'eael-advanced-data-table',
		[
			'ea_adv_data_table_source'      => 'static',
			'ea_adv_data_table_static_html' => $table_html,
			'ea_adv_data_table_sort'        => 'yes',
			'ea_adv_data_table_search'      => 'yes',
			'ea_adv_data_table_pagination'  => '',
		]
	),

	ea_heading( 'Advanced Data Table | Pagination Type: Select' ),
	ea_widget( 'test-adt-pag-select', 'eael-advanced-data-table',
		[
			'ea_adv_data_table_source'          => 'static',
			'ea_adv_data_table_static_html'     => $table_html,
			'ea_adv_data_table_sort'            => 'yes',
			'ea_adv_data_table_search'          => 'yes',
			'ea_adv_data_table_pagination'      => 'yes',
			'ea_adv_data_table_pagination_type' => 'select',
		]
	),

	ea_heading( 'Advanced Data Table | Search Alignment: Left' ),
	ea_widget( 'test-adt-search-left', 'eael-advanced-data-table',
		[
			'ea_adv_data_table_source'           => 'static',
			'ea_adv_data_table_static_html'      => $table_html,
			'ea_adv_data_table_sort'             => 'yes',
			'ea_adv_data_table_search'           => 'yes',
			'ea_adv_data_table_search_alignment' => 'left',
			'ea_adv_data_table_pagination'       => 'yes',
		]
	),

	ea_heading( 'Advanced Data Table | Search Alignment: Center' ),
	ea_widget( 'test-adt-search-center', 'eael-advanced-data-table',
		[
			'ea_adv_data_table_source'           => 'static',
			'ea_adv_data_table_static_html'      => $table_html,
			'ea_adv_data_table_sort'             => 'yes',
			'ea_adv_data_table_search'           => 'yes',
			'ea_adv_data_table_search_alignment' => 'center',
			'ea_adv_data_table_pagination'       => 'yes',
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

WP_CLI::success( 'Advanced Data Table page ready → /' . $slug . '/' );
