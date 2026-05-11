<?php
/**
 * Test page: Info Box
 * Run via: wp eval-file /scripts/setup-info-box-page.php
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

// ── Info Box page ──────────────────────────────────────────────────────────

WP_CLI::log( '' );
WP_CLI::log( '--- Info Box page ---' );

$slug    = getenv( 'INFO_BOX_PAGE_SLUG' ) ?: 'info-box';
$page_id = ea_upsert_page( $slug, 'Info Box' );

$icon_default = [ 'value' => 'eicon-info-circle', 'library' => 'eicons' ];
$link_default = [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ];

$widgets = [

    // ══════════════════════════════════════════════════════════════════════
    // Image/Icon Position Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Image/Icon Position ──', 'h2' ),

    ea_heading( 'Default Info Box (Icon on Top)' ),
    ea_widget( 'test-ib-default', 'eael-info-box', [
        'eael_infobox_img_type'    => 'img-on-top',
        'eael_infobox_img_or_icon' => 'icon',
        'eael_infobox_icon_new'    => $icon_default,
        'eael_infobox_title'       => 'Default Info Box',
        'eael_infobox_text'        => '<p>Default info box description text.</p>',
    ] ),

    ea_heading( 'Info Box | Icon on Bottom' ),
    ea_widget( 'test-ib-img-bottom', 'eael-info-box', [
        'eael_infobox_img_type'    => 'img-on-bottom',
        'eael_infobox_img_or_icon' => 'icon',
        'eael_infobox_icon_new'    => $icon_default,
        'eael_infobox_title'       => 'Icon on Bottom',
        'eael_infobox_text'        => '<p>Icon appears below content.</p>',
    ] ),

    ea_heading( 'Info Box | Icon on Left' ),
    ea_widget( 'test-ib-img-left', 'eael-info-box', [
        'eael_infobox_img_type'    => 'img-on-left',
        'eael_infobox_img_or_icon' => 'icon',
        'eael_infobox_icon_new'    => $icon_default,
        'eael_infobox_title'       => 'Icon on Left',
        'eael_infobox_text'        => '<p>Icon appears to the left of content.</p>',
    ] ),

    ea_heading( 'Info Box | Icon on Right' ),
    ea_widget( 'test-ib-img-right', 'eael-info-box', [
        'eael_infobox_img_type'    => 'img-on-right',
        'eael_infobox_img_or_icon' => 'icon',
        'eael_infobox_icon_new'    => $icon_default,
        'eael_infobox_title'       => 'Icon on Right',
        'eael_infobox_text'        => '<p>Icon appears to the right of content.</p>',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Icon / Media Type Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Icon / Media Type ──', 'h2' ),

    ea_heading( 'Info Box | No Icon (None)' ),
    ea_widget( 'test-ib-icon-none', 'eael-info-box', [
        'eael_infobox_img_or_icon' => 'none',
        'eael_infobox_title'       => 'No Icon Info Box',
        'eael_infobox_text'        => '<p>This info box has no icon or image.</p>',
    ] ),

    ea_heading( 'Info Box | Number Type' ),
    ea_widget( 'test-ib-icon-number', 'eael-info-box', [
        'eael_infobox_img_or_icon' => 'number',
        'eael_infobox_number'      => '42',
        'eael_infobox_title'       => 'Number Icon Info Box',
        'eael_infobox_text'        => '<p>This info box shows a number.</p>',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Sub Title Variant
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Sub Title ──', 'h2' ),

    ea_heading( 'Info Box | With Sub Title' ),
    ea_widget( 'test-ib-subtitle', 'eael-info-box', [
        'eael_infobox_img_or_icon'    => 'icon',
        'eael_infobox_icon_new'       => $icon_default,
        'eael_infobox_title'          => 'Info Box With Sub Title',
        'eael_infobox_show_sub_title' => 'yes',
        'eael_infobox_sub_title'      => 'This Is A Sub Title',
        'eael_infobox_text'           => '<p>Info box with sub title visible.</p>',
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Button Variants
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Button ──', 'h2' ),

    ea_heading( 'Info Box | With Button' ),
    ea_widget( 'test-ib-btn', 'eael-info-box', [
        'eael_infobox_img_or_icon' => 'icon',
        'eael_infobox_icon_new'    => $icon_default,
        'eael_infobox_title'       => 'Info Box With Button',
        'eael_show_infobox_button' => 'yes',
        'infobox_button_text'      => 'Learn More',
        'infobox_button_link_url'  => $link_default,
    ] ),

    ea_heading( 'Info Box | Button External Link' ),
    ea_widget( 'test-ib-btn-external', 'eael-info-box', [
        'eael_infobox_img_or_icon' => 'icon',
        'eael_infobox_icon_new'    => $icon_default,
        'eael_infobox_title'       => 'External Link Button',
        'eael_show_infobox_button' => 'yes',
        'infobox_button_text'      => 'Visit Site',
        'infobox_button_link_url'  => [
            'url'               => 'https://essential-addons.com',
            'is_external'       => 'on',
            'nofollow'          => '',
            'custom_attributes' => '',
        ],
    ] ),

    ea_heading( 'Info Box | Button Nofollow Link' ),
    ea_widget( 'test-ib-btn-nofollow', 'eael-info-box', [
        'eael_infobox_img_or_icon' => 'icon',
        'eael_infobox_icon_new'    => $icon_default,
        'eael_infobox_title'       => 'Nofollow Button',
        'eael_show_infobox_button' => 'yes',
        'infobox_button_text'      => 'Read More',
        'infobox_button_link_url'  => [
            'url'               => '#',
            'is_external'       => '',
            'nofollow'          => 'on',
            'custom_attributes' => '',
        ],
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Clickable Infobox
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Clickable Infobox ──', 'h2' ),

    ea_heading( 'Info Box | Clickable' ),
    ea_widget( 'test-ib-clickable', 'eael-info-box', [
        'eael_infobox_img_or_icon'         => 'icon',
        'eael_infobox_icon_new'            => $icon_default,
        'eael_infobox_title'               => 'Clickable Info Box',
        'eael_show_infobox_clickable'      => 'yes',
        'eael_show_infobox_clickable_link' => [
            'url'               => 'https://essential-addons.com',
            'is_external'       => 'on',
            'nofollow'          => '',
            'custom_attributes' => '',
        ],
    ] ),

    // ══════════════════════════════════════════════════════════════════════
    // Content Alignment (applies when img-on-top)
    // ══════════════════════════════════════════════════════════════════════

    ea_heading( '── Content Alignment ──', 'h2' ),

    ea_heading( 'Info Box | Align Left' ),
    ea_widget( 'test-ib-align-left', 'eael-info-box', [
        'eael_infobox_img_type'          => 'img-on-top',
        'eael_infobox_img_or_icon'       => 'icon',
        'eael_infobox_icon_new'          => $icon_default,
        'eael_infobox_title'             => 'Left Aligned Info Box',
        'eael_infobox_content_alignment' => 'left',
    ] ),

    ea_heading( 'Info Box | Align Right' ),
    ea_widget( 'test-ib-align-right', 'eael-info-box', [
        'eael_infobox_img_type'          => 'img-on-top',
        'eael_infobox_img_or_icon'       => 'icon',
        'eael_infobox_icon_new'          => $icon_default,
        'eael_infobox_title'             => 'Right Aligned Info Box',
        'eael_infobox_content_alignment' => 'right',
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

WP_CLI::success( 'Info Box page ready → /info-box/' );
