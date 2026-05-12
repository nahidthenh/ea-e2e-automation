<?php
/**
 * Test page: CTA Box
 * Run via: wp eval-file /scripts/setup-cta-box-page.php
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

// - CTA Box page --------------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- CTA Box page ---' );

$slug    = getenv( 'CTA_BOX_PAGE_SLUG' ) ?: 'cta-box';
$page_id = ea_upsert_page( $slug, 'CTA Box' );

// Shared safe defaults
$default_link    = [ 'url' => '#', 'is_external' => '', 'nofollow' => '', 'custom_attributes' => '' ];
$external_link   = [ 'url' => '#', 'is_external' => 'on', 'nofollow' => '', 'custom_attributes' => '' ];
$nofollow_link   = [ 'url' => '#', 'is_external' => '', 'nofollow' => 'on', 'custom_attributes' => '' ];

$widgets = [

    // ========================================================================
    // Layout Styles
    // eael_cta_type controls which layout template is rendered.
    // ========================================================================

    ea_heading( '- Layout Styles -', 'h2' ),

    ea_heading( 'Default CTA Box' ),
    ea_widget( 'test-ctab-default', 'eael-cta-box', [
        'eael_cta_type'       => 'cta-basic',
        'eael_cta_preset'     => 'cta-preset-1',
        'eael_cta_title'      => 'CTA Title',
        'eael_cta_btn_text'   => 'Click Here',
        'eael_cta_btn_link'   => $default_link,
    ] ),

    ea_heading( 'CTA Box | Style: Flex Grid' ),
    ea_widget( 'test-ctab-flex', 'eael-cta-box', [
        'eael_cta_type'     => 'cta-flex',
        'eael_cta_title'    => 'Flex CTA Title',
        'eael_cta_btn_text' => 'Click Here',
        'eael_cta_btn_link' => $default_link,
    ] ),

    ea_heading( 'CTA Box | Style: Flex Grid with Icon' ),
    ea_widget( 'test-ctab-icon-flex', 'eael-cta-box', [
        'eael_cta_type'              => 'cta-icon-flex',
        'eael_cta_flex_grid_icon_new'=> [ 'value' => 'eicon-info-circle', 'library' => 'eicons' ],
        'eael_cta_title'             => 'Icon Flex CTA Title',
        'eael_cta_btn_text'          => 'Click Here',
        'eael_cta_btn_link'          => $default_link,
    ] ),

    // ========================================================================
    // Presets
    // ========================================================================

    ea_heading( '- Presets -', 'h2' ),

    ea_heading( 'CTA Box | Preset 2' ),
    ea_widget( 'test-ctab-preset-2', 'eael-cta-box', [
        'eael_cta_type'       => 'cta-basic',
        'eael_cta_preset'     => 'cta-preset-2',
        'eael_cta_btn_preset' => 'cta-btn-preset-2',
        'eael_cta_title'      => 'Preset 2 CTA Title',
        'eael_cta_btn_text'   => 'Click Here',
        'eael_cta_btn_link'   => $default_link,
    ] ),

    // ========================================================================
    // Buttons
    // ========================================================================

    ea_heading( '- Buttons -', 'h2' ),

    ea_heading( 'CTA Box | Secondary Button' ),
    ea_widget( 'test-ctab-secondary', 'eael-cta-box', [
        'eael_cta_type'                  => 'cta-basic',
        'eael_cta_title'                 => 'Dual Button CTA',
        'eael_cta_btn_text'              => 'Primary',
        'eael_cta_btn_link'              => $default_link,
        'eael_cta_secondary_btn_is_show' => 'yes',
        'eael_cta_secondary_btn_text'    => 'Learn More',
        'eael_cta_secondary_btn_link'    => $default_link,
    ] ),

    // ========================================================================
    // Link Variants
    // ========================================================================

    ea_heading( '- Link Variants -', 'h2' ),

    ea_heading( 'CTA Box | External Link (target=_blank)' ),
    ea_widget( 'test-ctab-link-external', 'eael-cta-box', [
        'eael_cta_type'     => 'cta-basic',
        'eael_cta_title'    => 'External Link CTA',
        'eael_cta_btn_text' => 'Click Here',
        'eael_cta_btn_link' => $external_link,
    ] ),

    ea_heading( 'CTA Box | Nofollow Link' ),
    ea_widget( 'test-ctab-link-nofollow', 'eael-cta-box', [
        'eael_cta_type'     => 'cta-basic',
        'eael_cta_title'    => 'Nofollow Link CTA',
        'eael_cta_btn_text' => 'Click Here',
        'eael_cta_btn_link' => $nofollow_link,
    ] ),

    // ========================================================================
    // Alignment
    // prefix_class 'content-align-%s' → e.g. content-align-cta-center on {{WRAPPER}}
    // ========================================================================

    ea_heading( '- Alignment -', 'h2' ),

    ea_heading( 'CTA Box | Alignment: Center' ),
    ea_widget( 'test-ctab-align-center', 'eael-cta-box', [
        'eael_cta_type'         => 'cta-basic',
        'eael_cta_content_type' => 'cta-center',
        'eael_cta_title'        => 'Center Aligned CTA',
        'eael_cta_btn_text'     => 'Click Here',
        'eael_cta_btn_link'     => $default_link,
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

WP_CLI::success( 'CTA Box page ready → /cta-box/' );
