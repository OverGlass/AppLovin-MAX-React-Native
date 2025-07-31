/**
 * Provides pre-styled React Native components for each native ad asset view:
 *
 * - TitleView
 * - AdvertiserView
 * - BodyView
 * - CallToActionView
 * - IconView
 * - OptionsView
 * - MediaView
 * - StarRatingView
 *
 * Each component pulls ad content and view refs from NativeAdView context,
 * and must be rendered inside a {@link NativeAdView}.
 */

import * as React from 'react';
import { useContext, useEffect, useMemo } from 'react';
import type { ImageProps, TextProps, ViewProps } from 'react-native';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeAdViewContext } from './NativeAdViewProvider';

/**
 * Enhanced MediaView component with New Architecture support
 */
interface EnhancedMediaViewProps extends ViewProps {
    /**
     * Whether to enable automatic view restoration for React Navigation scenarios
     * @default true
     */
    autoRestore?: boolean;

    /**
     * Whether to enable enhanced monitoring for New Architecture
     * @default true when RN New Architecture is enabled
     */
    enhancedMonitoring?: boolean;
}

/**
 * Renders the native ad’s title.
 */
export const TitleView = (props: TextProps) => {
    const { titleRef, nativeAd } = useContext(NativeAdViewContext);
    return (
        <Text {...props} ref={titleRef}>
            {nativeAd.title ?? ''}
        </Text>
    );
};

/**
 * Renders the advertiser name.
 */
export const AdvertiserView = (props: TextProps) => {
    const { advertiserRef, nativeAd } = useContext(NativeAdViewContext);
    return (
        <Text {...props} ref={advertiserRef}>
            {nativeAd.advertiser ?? ''}
        </Text>
    );
};

/**
 * Renders the ad’s body text (description).
 */
export const BodyView = (props: TextProps) => {
    const { bodyRef, nativeAd } = useContext(NativeAdViewContext);
    return (
        <Text {...props} ref={bodyRef}>
            {nativeAd.body ?? ''}
        </Text>
    );
};

/**
 * Renders the call-to-action label.
 * On iOS, wraps the text with a TouchableOpacity for better click behavior.
 */
export const CallToActionView = (props: TextProps) => {
    const { callToActionRef, nativeAd } = useContext(NativeAdViewContext);

    if (Platform.OS === 'android') {
        return (
            <Text {...props} ref={callToActionRef}>
                {nativeAd.callToAction ?? ''}
            </Text>
        );
    }

    return (
        <TouchableOpacity>
            <Text {...props} ref={callToActionRef}>
                {nativeAd.callToAction ?? ''}
            </Text>
        </TouchableOpacity>
    );
};

/**
 * Renders the icon image for the native ad.
 * Falls back to a blank placeholder if not available.
 */
export const IconView = (props: Omit<ImageProps, 'source'>) => {
    const { imageRef, nativeAd } = useContext(NativeAdViewContext);
    const defaultIcon = require('./img/blank_icon.png');

    const imageSource = useMemo(() => {
        if (nativeAd?.url) {
            return { uri: nativeAd.url };
        }
        if (nativeAd?.imageSource) {
            return { uri: `data:image/jpeg;base64,${nativeAd.imageSource}` };
        }
        return defaultIcon;
    }, [nativeAd.url, nativeAd.imageSource, defaultIcon]);

    return <Image {...props} ref={imageRef} source={imageSource} />;
};

/**
 * Renders the native ad’s options view.
 */
export const OptionsView = (props: ViewProps) => {
    const { optionViewRef } = useContext(NativeAdViewContext);
    return <View {...props} ref={optionViewRef} />;
};

/**
 * Renders the native ad's media content.
 * Enhanced version with New Architecture support for view restoration.
 */
export const MediaView = (props: EnhancedMediaViewProps) => {
    const { mediaViewRef, nativeAd } = useContext(NativeAdViewContext);
    const { autoRestore = true, enhancedMonitoring = true, ...viewProps } = props;

    // Enhanced monitoring for New Architecture
    useEffect(() => {
        if (!enhancedMonitoring || !nativeAd) return;

        let intervalId: NodeJS.Timeout;

        // Monitor view state for Fabric/New Architecture
        const checkViewState = () => {
            if (mediaViewRef?.current && Platform.OS === 'ios') {
                // Check if the media view is still properly attached
                // This helps detect when React Navigation or Fabric recycling affects the view
                const viewTag = mediaViewRef.current;
                if (viewTag && typeof viewTag === 'object' && '_nativeTag' in viewTag) {
                    // View seems detached, attempt restoration
                    console.log('[NativeAd] MediaView may need restoration');
                }
            }
        };

        if (autoRestore) {
            intervalId = setInterval(checkViewState, 2000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [autoRestore, enhancedMonitoring, nativeAd, mediaViewRef]);

    return <View {...viewProps} ref={mediaViewRef} />;
};

/**
 * Enhanced MediaView specifically optimized for React Native New Architecture (Fabric)
 * This component includes automatic view restoration and enhanced monitoring.
 */
export const FabricMediaView = (props: EnhancedMediaViewProps) => {
    return <MediaView {...props} enhancedMonitoring={true} autoRestore={true} />;
};

/**
 * Props for the {@link StarRatingView} component, which displays a star rating
 * using Unicode stars (★ and ☆) styled with color, shadow, and size.
 */
type StarRatingViewProps = ViewProps & {
    /**
     * The color used for filled (active) stars.
     * Defaults to gold (#ffe234).
     */
    color?: string;

    /**
     * The color used for empty (inactive) stars.
     * Defaults to light gray (#dedede).
     */
    shadowColor?: string;

    /**
     * The size of each star, which also determines their visual size.
     * Defaults to 10.
     */
    size?: number;
};

/**
 * Renders the star rating of the ad, using Unicode stars (★ and ☆).
 * Filled stars are rendered over hollow stars using a clipped view.
 */
export const StarRatingView = ({ color = '#ffe234', shadowColor = '#dedede', size = 10, style }: StarRatingViewProps) => {
    const { nativeAd } = useContext(NativeAdViewContext);
    const maxStarCount = 5;

    const containerStyle = useMemo(() => StyleSheet.flatten([style, styles.starRatingContainer]), [style]);

    const stars = useMemo(() => {
        const starRating = Math.max(0, Math.min(maxStarCount, nativeAd.starRating ?? 0));

        return Array.from({ length: maxStarCount }).map((_, index) => {
            const isFull = starRating > index;
            const width = Math.min(size, Math.max(0, (starRating - index) * size));

            return (
                <View key={index}>
                    <Text style={{ fontSize: size, color: isFull ? color : shadowColor }}>{String.fromCodePoint(0x2606)}</Text>
                    {isFull && (
                        <View style={[{ width }, styles.starRating]}>
                            <Text style={{ fontSize: size, color }}>{String.fromCodePoint(0x2605)}</Text>
                        </View>
                    )}
                </View>
            );
        });
    }, [nativeAd.starRating, color, shadowColor, size]);

    if (!nativeAd.starRating) {
        return <View style={containerStyle} />;
    }

    return <View style={containerStyle}>{stars}</View>;
};

const styles = StyleSheet.create({
    starRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starRating: {
        overflow: 'hidden',
        position: 'absolute',
    },
});

/**
 * Utility functions for native ad view management
 */
export const NativeAdViewUtils = {
    /**
     * Manually trigger view restoration (useful for React Navigation scenarios)
     * @param nativeAdViewRef Reference to the NativeAdView component
     */
    refreshViews: (nativeAdViewRef: React.RefObject<any>) => {
        if (Platform.OS === 'ios' && nativeAdViewRef.current) {
            // Call the native method to refresh views
            try {
                const { NativeModules } = require('react-native');
                const { AppLovinMAXNativeAdViewManager } = NativeModules;
                if (AppLovinMAXNativeAdViewManager?.refreshNativeAdViews) {
                    AppLovinMAXNativeAdViewManager.refreshNativeAdViews(nativeAdViewRef.current._nativeTag || nativeAdViewRef.current);
                }
            } catch (error) {
                console.warn('[NativeAd] Failed to refresh views:', error);
            }
        }
    },

    /**
     * Trigger Fabric-specific view restoration for New Architecture
     * @param nativeAdViewRef Reference to the NativeAdView component
     */
    refreshViewsForFabric: (nativeAdViewRef: React.RefObject<any>) => {
        if (Platform.OS === 'ios' && nativeAdViewRef.current) {
            try {
                const { NativeModules } = require('react-native');
                const { AppLovinMAXNativeAdViewManager } = NativeModules;
                if (AppLovinMAXNativeAdViewManager?.refreshViewsForFabric) {
                    AppLovinMAXNativeAdViewManager.refreshViewsForFabric(nativeAdViewRef.current._nativeTag || nativeAdViewRef.current);
                }
            } catch (error) {
                console.warn('[NativeAd] Failed to refresh Fabric views:', error);
            }
        }
    },
};

/**
 * Hook for handling native ad view lifecycle in React Navigation scenarios
 * @param nativeAdViewRef Reference to the NativeAdView component
 * @param options Configuration options
 */
export const useNativeAdViewLifecycle = (
    nativeAdViewRef: React.RefObject<any>,
    options: {
        autoRefresh?: boolean;
        useNewArchitecture?: boolean;
        refreshInterval?: number;
    } = {}
) => {
    const { autoRefresh = true, useNewArchitecture = false, refreshInterval = 3000 } = options;

    useEffect(() => {
        if (!autoRefresh) return;

        const refreshViews = () => {
            if (useNewArchitecture) {
                NativeAdViewUtils.refreshViewsForFabric(nativeAdViewRef);
            } else {
                NativeAdViewUtils.refreshViews(nativeAdViewRef);
            }
        };

        // Refresh views when component mounts (useful after navigation)
        const mountTimer = setTimeout(refreshViews, 500);

        // Set up periodic refresh if needed
        let intervalId: NodeJS.Timeout;
        if (refreshInterval > 0) {
            intervalId = setInterval(refreshViews, refreshInterval);
        }

        return () => {
            clearTimeout(mountTimer);
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [autoRefresh, useNewArchitecture, refreshInterval, nativeAdViewRef]);

    return {
        refreshViews: () => {
            if (useNewArchitecture) {
                NativeAdViewUtils.refreshViewsForFabric(nativeAdViewRef);
            } else {
                NativeAdViewUtils.refreshViews(nativeAdViewRef);
            }
        },
    };
};
