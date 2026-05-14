<?php
/**
 * Test page: NFT Gallery
 * Run via: wp eval-file /scripts/setup-nft-gallery-page.php
 *
 * Requires OPEN_SEA_API and OPEN_SEA_COLLECTIONS env vars to be set
 * in the container (configured in docker-compose.yml wpcli environment).
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

// - NFT Gallery page ----------------------------

WP_CLI::log( '' );
WP_CLI::log( '--- NFT Gallery page ---' );

$open_sea_api        = getenv( 'OPEN_SEA_API' ) ?: '';
$open_sea_collection = getenv( 'OPEN_SEA_COLLECTIONS' ) ?: '';

if ( empty( $open_sea_api ) ) {
    WP_CLI::warning( 'OPEN_SEA_API env var is not set — widget will render error messages instead of items.' );
}
if ( empty( $open_sea_collection ) ) {
    WP_CLI::warning( 'OPEN_SEA_COLLECTIONS env var is not set — widget will render error messages instead of items.' );
}

$slug    = getenv( 'NFT_GALLERY_PAGE_SLUG' ) ?: 'nft-gallery';
$page_id = ea_upsert_page( $slug, 'NFT Gallery' );

// Base OpenSea settings shared by all instances.
$base = [
    'eael_nft_gallery_sources'                 => 'opensea',
    'eael_nft_gallery_source_key'              => $open_sea_api,
    'eael_nft_gallery_opensea_type'            => 'collections',
    'eael_nft_gallery_opensea_filterby_wallet' => $open_sea_collection,
    'eael_nft_gallery_opensea_item_limit'      => 6,
    'eael_nft_gallery_opensea_data_cache_time' => 60,
    'eael_nft_gallery_items_layout'            => 'grid',
    'eael_nft_gallery_style_preset'            => 'preset-1',
    'eael_nft_gallery_column'                  => '3',
    'eael_nft_gallery_show_image'              => 'yes',
    'eael_nft_gallery_show_title'              => 'yes',
    'eael_nft_gallery_show_current_price'      => 'yes',
    'eael_nft_gallery_show_chain'              => 'yes',
    'eael_nft_gallery_show_button'             => 'yes',
    'eael_nft_gallery_show_last_sale_ends_in'  => 'yes',
];

$widgets = [

    // ====================================================================
    // Layout Types
    // ====================================================================

    ea_heading( '- Layout Types -', 'h2' ),

    ea_heading( 'Default NFT Gallery (Grid, Preset 1)' ),
    ea_widget( 'test-ng-default', 'eael-nft-gallery', $base ),

    ea_heading( 'NFT Gallery | Layout: Grid, Preset 2' ),
    ea_widget( 'test-ng-preset-2', 'eael-nft-gallery',
        array_merge( $base, [
            'eael_nft_gallery_style_preset' => 'preset-2',
        ] )
    ),

    ea_heading( 'NFT Gallery | Layout: List' ),
    ea_widget( 'test-ng-list', 'eael-nft-gallery',
        array_merge( $base, [
            'eael_nft_gallery_items_layout' => 'list',
        ] )
    ),

    // ====================================================================
    // Content Toggles
    // ====================================================================

    ea_heading( '- Content Toggles -', 'h2' ),

    ea_heading( 'NFT Gallery | Title: Hidden' ),
    ea_widget( 'test-ng-no-title', 'eael-nft-gallery',
        array_merge( $base, [
            'eael_nft_gallery_show_title' => '',
        ] )
    ),

    ea_heading( 'NFT Gallery | Current Price: Hidden' ),
    ea_widget( 'test-ng-no-price', 'eael-nft-gallery',
        array_merge( $base, [
            'eael_nft_gallery_show_current_price' => '',
        ] )
    ),

    ea_heading( 'NFT Gallery | Image: Hidden' ),
    ea_widget( 'test-ng-no-image', 'eael-nft-gallery',
        array_merge( $base, [
            'eael_nft_gallery_show_image' => '',
        ] )
    ),

    ea_heading( 'NFT Gallery | Chain Badge: Hidden' ),
    ea_widget( 'test-ng-no-chain', 'eael-nft-gallery',
        array_merge( $base, [
            'eael_nft_gallery_show_chain' => '',
        ] )
    ),

    // ====================================================================
    // Pagination
    // ====================================================================

    ea_heading( '- Pagination -', 'h2' ),

    ea_heading( 'NFT Gallery | Load More Button' ),
    ea_widget( 'test-ng-load-more', 'eael-nft-gallery',
        array_merge( $base, [
            'eael_nft_gallery_pagination'      => 'yes',
            'eael_nft_gallery_posts_per_page'  => 3,
            'eael_nft_gallery_load_more_text'  => 'Load More',
        ] )
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

WP_CLI::success( 'NFT Gallery page ready → /' . $slug . '/' );
