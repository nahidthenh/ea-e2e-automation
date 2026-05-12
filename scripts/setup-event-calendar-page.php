<?php
/**
 * Test page: Event Calendar
 * Run via: wp eval-file /scripts/setup-event-calendar-page.php
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

// ── Event Calendar page ──────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Event Calendar page ---' );

$slug    = getenv( 'EVENT_CALENDAR_PAGE_SLUG' ) ?: 'event-calendar';
$page_id = ea_upsert_page( $slug, 'Event Calendar' );

// Shared manual events — future dates so they always pass the table date filter
$sample_events = [
	[
		'_id'                      => 'ec000001',
		'eael_event_title'         => 'Team Kickoff Meeting',
		'eael_event_all_day'       => '',
		'eael_event_start_date'    => '2027-05-20 09:00',
		'eael_event_end_date'      => '2027-05-20 10:00',
		'eael_event_start_date_allday' => '',
		'eael_event_end_date_allday'   => '',
		'eael_event_description'   => 'Kickoff session for Q2 planning.',
		'eael_event_bg_color'      => '#5725ff',
		'eael_event_text_color'    => '#ffffff',
		'eael_event_border_color'  => '#E8E6ED',
		'eael_event_link'          => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
		'eael_event_redirection'   => '',
		'eael_event_location'      => 'Conference Room A',
		'eael_event_category'      => '',
	],
	[
		'_id'                      => 'ec000002',
		'eael_event_title'         => 'Product Launch Webinar',
		'eael_event_all_day'       => '',
		'eael_event_start_date'    => '2027-06-05 14:00',
		'eael_event_end_date'      => '2027-06-05 16:00',
		'eael_event_start_date_allday' => '',
		'eael_event_end_date_allday'   => '',
		'eael_event_description'   => 'Live demo and Q&A for the new product.',
		'eael_event_bg_color'      => '#ff5733',
		'eael_event_text_color'    => '#ffffff',
		'eael_event_border_color'  => '#E8E6ED',
		'eael_event_link'          => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
		'eael_event_redirection'   => '',
		'eael_event_location'      => 'Online',
		'eael_event_category'      => '',
	],
	[
		'_id'                      => 'ec000003',
		'eael_event_title'         => 'Annual Conference',
		'eael_event_all_day'       => 'yes',
		'eael_event_start_date'    => '',
		'eael_event_end_date'      => '',
		'eael_event_start_date_allday' => '2027-06-15',
		'eael_event_end_date_allday'   => '2027-06-15',
		'eael_event_description'   => 'Full-day industry conference.',
		'eael_event_bg_color'      => '#28a745',
		'eael_event_text_color'    => '#ffffff',
		'eael_event_border_color'  => '#E8E6ED',
		'eael_event_link'          => [ 'url' => '', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ],
		'eael_event_redirection'   => '',
		'eael_event_location'      => 'Convention Center',
		'eael_event_category'      => '',
	],
];

$widgets = [

	// ══════════════════════════════════════════════════════════════════════
	// Calendar Layout (FullCalendar — JS initialized)
	// ══════════════════════════════════════════════════════════════════════

	ea_heading( '── Calendar Layout (FullCalendar) ──', 'h2' ),

	ea_heading( 'Default Event Calendar (Month View)' ),
	ea_widget( 'test-ec-cal-default', 'eael-event-calendar',
		[
			'eael_event_calendar_type'       => 'manual',
			'eael_event_display_layout'      => 'calendar',
			'eael_event_calendar_default_view' => 'dayGridMonth',
			'eael_event_items'               => $sample_events,
		]
	),

	ea_heading( 'Event Calendar | Week View' ),
	ea_widget( 'test-ec-cal-week', 'eael-event-calendar',
		[
			'eael_event_calendar_type'       => 'manual',
			'eael_event_display_layout'      => 'calendar',
			'eael_event_calendar_default_view' => 'timeGridWeek',
			'eael_event_items'               => $sample_events,
		]
	),

	ea_heading( 'Event Calendar | Day View' ),
	ea_widget( 'test-ec-cal-day', 'eael-event-calendar',
		[
			'eael_event_calendar_type'       => 'manual',
			'eael_event_display_layout'      => 'calendar',
			'eael_event_calendar_default_view' => 'timeGridDay',
			'eael_event_items'               => $sample_events,
		]
	),

	ea_heading( 'Event Calendar | List Month View' ),
	ea_widget( 'test-ec-cal-list', 'eael-event-calendar',
		[
			'eael_event_calendar_type'       => 'manual',
			'eael_event_display_layout'      => 'calendar',
			'eael_event_calendar_default_view' => 'listMonth',
			'eael_event_items'               => $sample_events,
		]
	),

	// ══════════════════════════════════════════════════════════════════════
	// Table Layout (server-side HTML)
	// ══════════════════════════════════════════════════════════════════════

	ea_heading( '── Table Layout ──', 'h2' ),

	ea_heading( 'Event Calendar | Table — All Columns + Search' ),
	ea_widget( 'test-ec-table', 'eael-event-calendar',
		[
			'eael_event_calendar_type'            => 'manual',
			'eael_event_display_layout'           => 'table',
			'eael_table_ec_default_date_type'     => 'custom',
			'eael_table_event_calendar_default_date' => '2020-01-01',
			'eael_ec_show_search'                 => 'yes',
			'eael_ec_show_title'                  => 'yes',
			'eael_ec_show_description'            => 'yes',
			'eael_ec_show_date'                   => 'yes',
			'eael_ec_show_pagination'             => '',
			'eael_ec_title_label'                 => 'Title',
			'eael_ec_desc_label'                  => 'Description',
			'eael_ec_date_label'                  => 'Date',
			'eael_event_items'                    => $sample_events,
		]
	),

	ea_heading( 'Event Calendar | Table — No Search' ),
	ea_widget( 'test-ec-table-no-search', 'eael-event-calendar',
		[
			'eael_event_calendar_type'            => 'manual',
			'eael_event_display_layout'           => 'table',
			'eael_table_ec_default_date_type'     => 'custom',
			'eael_table_event_calendar_default_date' => '2020-01-01',
			'eael_ec_show_search'                 => '',
			'eael_ec_show_title'                  => 'yes',
			'eael_ec_show_description'            => 'yes',
			'eael_ec_show_date'                   => 'yes',
			'eael_ec_show_pagination'             => '',
			'eael_ec_title_label'                 => 'Title',
			'eael_ec_desc_label'                  => 'Description',
			'eael_ec_date_label'                  => 'Date',
			'eael_event_items'                    => $sample_events,
		]
	),

	ea_heading( 'Event Calendar | Table — No Description Column' ),
	ea_widget( 'test-ec-table-no-desc', 'eael-event-calendar',
		[
			'eael_event_calendar_type'            => 'manual',
			'eael_event_display_layout'           => 'table',
			'eael_table_ec_default_date_type'     => 'custom',
			'eael_table_event_calendar_default_date' => '2020-01-01',
			'eael_ec_show_search'                 => '',
			'eael_ec_show_title'                  => 'yes',
			'eael_ec_show_description'            => '',
			'eael_ec_show_date'                   => 'yes',
			'eael_ec_show_pagination'             => '',
			'eael_ec_title_label'                 => 'Title',
			'eael_ec_date_label'                  => 'Date',
			'eael_event_items'                    => $sample_events,
		]
	),

	ea_heading( 'Event Calendar | Table — Pagination (2 per page)' ),
	ea_widget( 'test-ec-table-paginated', 'eael-event-calendar',
		[
			'eael_event_calendar_type'            => 'manual',
			'eael_event_display_layout'           => 'table',
			'eael_table_ec_default_date_type'     => 'custom',
			'eael_table_event_calendar_default_date' => '2020-01-01',
			'eael_ec_show_search'                 => '',
			'eael_ec_show_title'                  => 'yes',
			'eael_ec_show_description'            => 'yes',
			'eael_ec_show_date'                   => 'yes',
			'eael_ec_show_pagination'             => 'yes',
			'eael_ec_item_per_page'               => 2,
			'eael_ec_title_label'                 => 'Title',
			'eael_ec_desc_label'                  => 'Description',
			'eael_ec_date_label'                  => 'Date',
			'eael_event_items'                    => $sample_events,
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

WP_CLI::success( 'Event Calendar page ready → /' . $slug . '/' );
