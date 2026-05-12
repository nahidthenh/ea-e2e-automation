<?php
/**
 * Seed sample WooCommerce products for EA widget testing.
 * Run via: wp eval-file /scripts/setup-sample-products.php
 */

if ( ! class_exists( 'WooCommerce' ) ) {
    WP_CLI::warning( 'WooCommerce is not active — skipping product seed.' );
    return;
}

WP_CLI::log( '' );
WP_CLI::log( '--- Sample WooCommerce Products ---' );

require_once __DIR__ . '/helpers-sample-data.php';

// - helpers ----------------------------------

function ea_get_or_create_term( string $name, string $taxonomy ): int {
    $term = get_term_by( 'name', $name, $taxonomy );
    if ( $term ) return (int) $term->term_id;
    $result = wp_insert_term( $name, $taxonomy );
    if ( is_wp_error( $result ) ) WP_CLI::error( $result->get_error_message() );
    return (int) $result['term_id'];
}

function ea_product_exists( string $sku ): bool {
    return (bool) wc_get_product_id_by_sku( $sku );
}

function ea_create_simple_product( array $data ): int {
    if ( ea_product_exists( $data['sku'] ) ) {
        WP_CLI::log( "  exists : {$data['name']} (SKU: {$data['sku']})" );
        return (int) wc_get_product_id_by_sku( $data['sku'] );
    }

    $product = new WC_Product_Simple();
    $product->set_name( $data['name'] );
    $product->set_sku( $data['sku'] );
    $product->set_regular_price( $data['regular_price'] );
    $product->set_sale_price( $data['sale_price'] ?? '' );
    $product->set_short_description( $data['short_description'] );
    $product->set_description( $data['description'] ?? '' );
    $product->set_manage_stock( false );
    $product->set_stock_status( 'instock' );
    $product->set_catalog_visibility( 'visible' );
    $product->set_status( 'publish' );
    $product->set_featured( $data['featured'] ?? false );
    $product->set_reviews_allowed( true );

    if ( ! empty( $data['category_ids'] ) ) {
        $product->set_category_ids( $data['category_ids'] );
    }

    if ( ! empty( $data['tag_ids'] ) ) {
        $product->set_tag_ids( $data['tag_ids'] );
    }

    $id = $product->save();

    $img_id = ea_create_placeholder_image( $data['name'], $data['color'] ?? '#e74c3c' );
    if ( $img_id ) {
        set_post_thumbnail( $id, $img_id );
    }

    WP_CLI::log( "  created: {$data['name']} (ID {$id}, SKU: {$data['sku']})" );
    return (int) $id;
}

// - categories --------------------------------

$cat_clothing     = ea_get_or_create_term( 'Clothing', 'product_cat' );
$cat_electronics  = ea_get_or_create_term( 'Electronics', 'product_cat' );
$cat_accessories  = ea_get_or_create_term( 'Accessories', 'product_cat' );
$cat_home         = ea_get_or_create_term( 'Home & Garden', 'product_cat' );

// - tags -----------------------------------

$tag_new      = ea_get_or_create_term( 'New Arrival', 'product_tag' );
$tag_sale     = ea_get_or_create_term( 'On Sale', 'product_tag' );
$tag_featured = ea_get_or_create_term( 'Featured', 'product_tag' );

// - products ---------------------------------

$products = [
    [
        'name'              => 'Classic T-Shirt',
        'sku'               => 'ea-tshirt-001',
        'regular_price'     => '29.99',
        'sale_price'        => '19.99',
        'short_description' => 'A comfortable everyday classic t-shirt.',
        'description'       => 'Made from 100% premium cotton. Available in multiple colors.',
        'featured'          => true,
        'category_ids'      => [ $cat_clothing ],
        'tag_ids'           => [ $tag_sale, $tag_featured ],
        'color'             => '#e74c3c',
    ],
    [
        'name'              => 'Slim Fit Hoodie',
        'sku'               => 'ea-hoodie-001',
        'regular_price'     => '59.99',
        'short_description' => 'Warm and stylish hoodie for all seasons.',
        'description'       => 'Soft fleece lining with a modern slim fit.',
        'featured'          => false,
        'category_ids'      => [ $cat_clothing ],
        'tag_ids'           => [ $tag_new ],
        'color'             => '#c0392b',
    ],
    [
        'name'              => 'Wireless Headphones',
        'sku'               => 'ea-headphones-001',
        'regular_price'     => '129.99',
        'sale_price'        => '99.99',
        'short_description' => 'Premium wireless headphones with noise cancellation.',
        'description'       => '40-hour battery life, foldable design, Bluetooth 5.0.',
        'featured'          => true,
        'category_ids'      => [ $cat_electronics ],
        'tag_ids'           => [ $tag_sale, $tag_featured ],
        'color'             => '#2980b9',
    ],
    [
        'name'              => 'Smartwatch Pro',
        'sku'               => 'ea-smartwatch-001',
        'regular_price'     => '199.99',
        'short_description' => 'Track your fitness and stay connected.',
        'description'       => 'Heart rate monitor, GPS, water resistant up to 50m.',
        'featured'          => true,
        'category_ids'      => [ $cat_electronics ],
        'tag_ids'           => [ $tag_new, $tag_featured ],
        'color'             => '#1a5276',
    ],
    [
        'name'              => 'Leather Wallet',
        'sku'               => 'ea-wallet-001',
        'regular_price'     => '39.99',
        'short_description' => 'Slim genuine leather bifold wallet.',
        'description'       => 'Holds up to 8 cards with RFID blocking technology.',
        'featured'          => false,
        'category_ids'      => [ $cat_accessories ],
        'tag_ids'           => [ $tag_new ],
        'color'             => '#784212',
    ],
    [
        'name'              => 'Canvas Backpack',
        'sku'               => 'ea-backpack-001',
        'regular_price'     => '49.99',
        'sale_price'        => '39.99',
        'short_description' => 'Durable canvas backpack for work and travel.',
        'description'       => '15-inch laptop compartment, multiple pockets, water resistant.',
        'featured'          => false,
        'category_ids'      => [ $cat_accessories ],
        'tag_ids'           => [ $tag_sale ],
        'color'             => '#6e2f1a',
    ],
    [
        'name'              => 'Ceramic Coffee Mug',
        'sku'               => 'ea-mug-001',
        'regular_price'     => '14.99',
        'short_description' => 'Handcrafted ceramic mug, 12oz.',
        'description'       => 'Microwave and dishwasher safe. Perfect for home or office.',
        'featured'          => false,
        'category_ids'      => [ $cat_home ],
        'tag_ids'           => [],
        'color'             => '#1e8449',
    ],
    [
        'name'              => 'Scented Candle Set',
        'sku'               => 'ea-candle-001',
        'regular_price'     => '24.99',
        'short_description' => 'Set of 3 natural soy wax scented candles.',
        'description'       => 'Long-burning 40-hour candles in lavender, vanilla and cedar.',
        'featured'          => false,
        'category_ids'      => [ $cat_home ],
        'tag_ids'           => [ $tag_new ],
        'color'             => '#6c3483',
    ],
];

$created = 0;
foreach ( $products as $product_data ) {
    ea_create_simple_product( $product_data );
    $created++;
}

WP_CLI::success( "Sample products ready → {$created} products seeded." );
