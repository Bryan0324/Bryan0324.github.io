document.addEventListener("DOMContentLoaded", () => {
        const config = window.CONFIG || {};
        const searchConfig = config.local_search || {};
        const options = config.localsearch || {};

        if (!searchConfig.path) {
                console.warn("`hexo-generator-searchdb` plugin is not installed!");
                return;
        }

        const input = document.querySelector(".search-input");
        const searchResultContainer = document.querySelector(".search-result-container");

        if (!input || !searchResultContainer) {
                console.warn("Search elements not found. Skipping init.");
                return;
        }

        const localSearch = new LocalSearch({
                path: searchConfig.path,
                top_n_per_article: options.top_n_per_article,
                unescape: options.unescape,
        });

        const performSearch = () => {
                if (!localSearch.isfetched)
                        return;

                const keyword = input.value.trim().toLowerCase();
                const keywords = keyword.split(/[-\s]+/);
                let resultItems = [];

                if (keyword.length > 0)
                        resultItems = localSearch.getResultItems(keywords);

                if (keywords.length === 1 && keywords[0] === "") {
                        searchResultContainer.classList.add("no-result");
                        searchResultContainer.innerHTML = '<div class="search-result-icon"><i class="fa fa-search fa-5x"></i></div>';
                }
                else if (resultItems.length === 0) {
                        searchResultContainer.classList.add("no-result");
                        searchResultContainer.innerHTML = '<div class="search-result-icon"><i class="far fa-frown fa-5x"></i></div>';
                }
                else {
                        resultItems.sort((prev, curr) => {
                                if (prev.includedCount !== curr.includedCount)
                                        return curr.includedCount - prev.includedCount;
                                if (prev.hitCount !== curr.hitCount)
                                        return curr.hitCount - prev.hitCount;
                                return curr.id - prev.id;
                        });

                        const statsText = config.i18n.hits.replace(/\$\{hits}/, resultItems.length);
                        searchResultContainer.classList.remove("no-result");
                        searchResultContainer.innerHTML = `<div class="search-stats">${statsText}</div>
                                <hr>
                                <ul class="search-result-list">${resultItems.map(item => item.item).join("")}</ul>`;
                }
        };

        localSearch.highlightSearchWords(document.querySelector(".post-body"));

        if (options.preload)
                localSearch.fetchData();

        // Auto-trigger search on input
        input.addEventListener("input", performSearch);

        // Also allow Enter key to trigger search
        input.addEventListener("keypress", event => {
                if (event.key === "Enter")
                        performSearch();
        });

        window.addEventListener("search:loaded", performSearch);

        document.querySelectorAll(".popup-trigger").forEach(trigger => {
                trigger.addEventListener("click", () => {
                        document.body.classList.add("search-active");
                        setTimeout(() => input.focus(), 500);
                        // Always fetch data when popup opens to ensure search works
                        if (!localSearch.isfetched)
                                localSearch.fetchData();
                });
        });
});
