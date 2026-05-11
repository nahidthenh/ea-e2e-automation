<?php
/**
 * Test page: Breadcrumbs
 * Run via: wp eval-file /scripts/setup-breadcrumbs-page.php
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

// ── Breadcrumbs page ──────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Breadcrumbs page ---' );

$slug    = getenv( 'BREADCRUMBS_PAGE_SLUG' ) ?: 'breadcrumbs';
$page_id = ea_upsert_page( $slug, 'Breadcrumbs' );

$widgets = [

	// ══════════════════════════════════════════════════════════════════════
	// General / Default
	// ══════════════════════════════════════════════════════════════════════

	ea_heading( '── General / Default ──', 'h2' ),

	ea_heading( 'Default Breadcrumbs' ),
	ea_widget( 'test-b-default', 'eael-breadcrumbs', [] ),

	ea_heading( 'Breadcrumbs | Custom Home Label: Start' ),
	ea_widget( 'test-b-home-custom', 'eael-breadcrumbs',
		[
			'breadcrumb_home_text' => 'Start',
		]
	),

	// ══════════════════════════════════════════════════════════════════════
	// Prefix Variants
	// ══════════════════════════════════════════════════════════════════════

	ea_heading( '── Prefix Variants ──', 'h2' ),

	ea_heading( 'Breadcrumbs | Prefix: Icon' ),
	ea_widget( 'test-b-prefix-icon', 'eael-breadcrumbs',
		[
			'breadcrumb_prefix_switch'    => 'yes',
			'eael_breadcrumb_prefix_type' => 'icon',
			'eael_breadcrumb_prefix_icon' => [
				'value'   => 'eicon-home',
				'library' => 'eicons',
			],
		]
	),

	ea_heading( 'Breadcrumbs | Prefix: Text' ),
	ea_widget( 'test-b-prefix-text', 'eael-breadcrumbs',
		[
			'breadcrumb_prefix_switch'    => 'yes',
			'eael_breadcrumb_prefix_type' => 'text',
			'eael_breadcrumb_prefix_text' => 'Browse: ',
		]
	),

	// ══════════════════════════════════════════════════════════════════════
	// Separator Variants
	// ══════════════════════════════════════════════════════════════════════

	ea_heading( '── Separator Variants ──', 'h2' ),

	ea_heading( 'Breadcrumbs | Separator: Icon (Arrow)' ),
	ea_widget( 'test-b-sep-icon', 'eael-breadcrumbs',
		[
			'eael_separator_type' => 'icon',
			'eael_separator_icon' => [
				'value'   => 'eicon-arrow-right',
				'library' => 'eicons',
			],
		]
	),

	ea_heading( 'Breadcrumbs | Separator: Custom Text (>>)' ),
	ea_widget( 'test-b-sep-custom', 'eael-breadcrumbs',
		[
			'eael_separator_type'      => 'text',
			'eael_separator_type_text' => '>>',
			// false makes empty() return true → forces the text branch in eael_breadcrumb_separator()
			'eael_separator_icon'      => false,
		]
	),

	// ══════════════════════════════════════════════════════════════════════
	// Alignment
	// ══════════════════════════════════════════════════════════════════════

	ea_heading( '── Alignment ──', 'h2' ),

	ea_heading( 'Breadcrumbs | Align: Left' ),
	ea_widget( 'test-b-align-left', 'eael-breadcrumbs',
		[
			'breadcrumb_align' => 'left',
		]
	),

	ea_heading( 'Breadcrumbs | Align: Center' ),
	ea_widget( 'test-b-align-center', 'eael-breadcrumbs',
		[
			'breadcrumb_align' => 'center',
		]
	),

	ea_heading( 'Breadcrumbs | Align: Right' ),
	ea_widget( 'test-b-align-right', 'eael-breadcrumbs',
		[
			'breadcrumb_align' => 'right',
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

WP_CLI::success( 'Breadcrumbs page ready → /breadcrumbs/' );
