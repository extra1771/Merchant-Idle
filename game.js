const { createApp, ref, computed, onMounted, onUnmounted } = Vue;

createApp({
    setup() {
        const gold = ref(0);
        const clickLevel = ref(0);
        const workerCount = ref(0);
        const shopLevel = ref(0);
        const totalClicks = ref(0);
        const totalGoldEarned = ref(0);
        const maxGoldPerSecond = ref(0);
        const startTime = ref(Date.now());
        const showStats = ref(false);
        const lastClickGain = ref(0);

        const clickPower = computed(() => Math.floor(10 + clickLevel.value * 5));
        const workerIncome = computed(() => Math.floor(5 + workerCount.value * 3));
        const shopBonus = computed(() => 1 + shopLevel.value * 0.1);
        const goldPerSecond = computed(() => Math.floor(workerIncome.value * shopBonus.value));
        
        const clickUpgradeCost = computed(() => Math.floor(50 + clickLevel.value * 25));
        const workerUpgradeCost = computed(() => Math.floor(40 + workerCount.value * 20));
        const shopUpgradeCost = computed(() => Math.floor(200 + shopLevel.value * 100));

        const playTime = computed(() => {
            const seconds = Math.floor((Date.now() - startTime.value) / 1000);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            if (hours > 0) return `${hours}h ${minutes}m`;
            if (minutes > 0) return `${minutes}m ${secs}s`;
            return `${secs}s`;
        });

        const achievements = ref([
            { id: 0, name: "初次经营", desc: "获得 100 金币", icon: "fas fa-star", requirement: 100, progress: 0, unlocked: false },
            { id: 1, name: "小有成就", desc: "获得 1000 金币", icon: "fas fa-medal", requirement: 1000, progress: 0, unlocked: false },
            { id: 2, name: "商业新星", desc: "获得 10000 金币", icon: "fas fa-gem", requirement: 10000, progress: 0, unlocked: false },
            { id: 3, name: "点击大师", desc: "点击 100 次", icon: "fas fa-hand-peace", requirement: 100, progress: 0, unlocked: false },
            { id: 4, name: "雇佣兵", desc: "雇佣 10 个工人", icon: "fas fa-users", requirement: 10, progress: 0, unlocked: false },
            { id: 5, name: "商铺大亨", desc: "商铺升级到 10 级", icon: "fas fa-crown", requirement: 10, progress: 0, unlocked: false },
            { id: 6, name: "日进斗金", desc: "秒收入达到 500", icon: "fas fa-chart-line", requirement: 500, progress: 0, unlocked: false }
        ]);

        function updateAchievements() {
            achievements.value[0].progress = totalGoldEarned.value;
            achievements.value[1].progress = totalGoldEarned.value;
            achievements.value[2].progress = totalGoldEarned.value;
            achievements.value[3].progress = totalClicks.value;
            achievements.value[4].progress = workerCount.value;
            achievements.value[5].progress = shopLevel.value;
            achievements.value[6].progress = goldPerSecond.value;

            achievements.value.forEach(ach => {
                if (!ach.unlocked && ach.progress >= ach.requirement) {
                    ach.unlocked = true;
                    gold.value += 50;
                    totalGoldEarned.value += 50;
                    showToast(ach.name);
                }
            });
        }

        function showToast(name) {
            const toast = document.createElement('div');
            toast.className = 'achievement-toast';
            toast.innerHTML = `<i class="fas fa-trophy"></i> 成就解锁: ${name} +50金币`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        function manualClick() {
            let gain = Math.floor(clickPower.value * shopBonus.value);
            gold.value += gain;
            totalGoldEarned.value += gain;
            totalClicks.value++;
            lastClickGain.value = gain;
            setTimeout(() => { lastClickGain.value = 0; }, 500);
            updateAchievements();
            saveGame();
        }

        function upgradeClick() {
            if (gold.value >= clickUpgradeCost.value) {
                gold.value -= clickUpgradeCost.value;
                clickLevel.value++;
                updateAchievements();
                saveGame();
            }
        }

        function upgradeWorker() {
            if (gold.value >= workerUpgradeCost.value) {
                gold.value -= workerUpgradeCost.value;
                workerCount.value++;
                updateAchievements();
                saveGame();
            }
        }

        function upgradeShop() {
            if (gold.value >= shopUpgradeCost.value) {
                gold.value -= shopUpgradeCost.value;
                shopLevel.value++;
                updateAchievements();
                saveGame();
            }
        }

        function resetGame() {
            if (confirm('确定要重置游戏吗？所有进度将会丢失！')) {
                gold.value = 0;
                clickLevel.value = 0;
                workerCount.value = 0;
                shopLevel.value = 0;
                totalClicks.value = 0;
                totalGoldEarned.value = 0;
                maxGoldPerSecond.value = 0;
                startTime.value = Date.now();
                achievements.value.forEach(ach => ach.unlocked = false);
                saveGame();
            }
        }

        function saveGame() {
            const saveData = {
                gold: gold.value,
                clickLevel: clickLevel.value,
                workerCount: workerCount.value,
                shopLevel: shopLevel.value,
                totalClicks: totalClicks.value,
                totalGoldEarned: totalGoldEarned.value,
                maxGoldPerSecond: maxGoldPerSecond.value,
                startTime: startTime.value,
                achievements: achievements.value.map(a => ({ id: a.id, unlocked: a.unlocked })),
                lastTickTime: Date.now()
            };
            localStorage.setItem('idleGameSave', JSON.stringify(saveData));
        }

        function loadGame() {
            const save = localStorage.getItem('idleGameSave');
            if (save) {
                try {
                    const data = JSON.parse(save);
                    gold.value = data.gold || 0;
                    clickLevel.value = data.clickLevel || 0;
                    workerCount.value = data.workerCount || 0;
                    shopLevel.value = data.shopLevel || 0;
                    totalClicks.value = data.totalClicks || 0;
                    totalGoldEarned.value = data.totalGoldEarned || 0;
                    maxGoldPerSecond.value = data.maxGoldPerSecond || 0;
                    startTime.value = data.startTime || Date.now();
                    
                    if (data.achievements) {
                        data.achievements.forEach(saved => {
                            const ach = achievements.value.find(a => a.id === saved.id);
                            if (ach) ach.unlocked = saved.unlocked;
                        });
                    }
                    updateAchievements();
                } catch(e) { console.error('加载存档失败', e); }
            }
        }

        function calculateOfflineProgress() {
            const save = localStorage.getItem('idleGameSave');
            if (save) {
                try {
                    const data = JSON.parse(save);
                    const lastTime = data.lastTickTime || Date.now();
                    const secondsOffline = Math.floor((Date.now() - lastTime) / 1000);
                    
                    if (secondsOffline > 5 && secondsOffline < 86400) {
                        const workerCnt = data.workerCount || 0;
                        const shopLv = data.shopLevel || 0;
                        const shopBonusOffline = 1 + shopLv * 0.1;
                        const workerIncomeOffline = Math.floor(5 + workerCnt * 3);
                        const gpsOffline = Math.floor(workerIncomeOffline * shopBonusOffline);
                        const offlineGold = gpsOffline * secondsOffline;
                        
                        if (offlineGold > 0) {
                            gold.value += offlineGold;
                            totalGoldEarned.value += offlineGold;
                            const timeStr = secondsOffline > 3600 ? `${Math.floor(secondsOffline / 3600)}小时` : 
                                            secondsOffline > 60 ? `${Math.floor(secondsOffline / 60)}分钟` : `${secondsOffline}秒`;
                            const toast = document.createElement('div');
                            toast.className = 'offline-toast';
                            toast.innerHTML = `<i class="fas fa-clock"></i> 离线 ${timeStr}，获得 ${formatNumber(offlineGold)} 金币！`;
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 5000);
                        }
                    }
                } catch(e) { console.error('离线计算失败', e); }
            }
            saveGame();
        }

        function formatNumber(num) {
            if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
            if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return Math.floor(num).toString();
        }

        let interval = null;
        
        function tick() {
            if (goldPerSecond.value > 0) {
                gold.value += goldPerSecond.value;
                totalGoldEarned.value += goldPerSecond.value;
                if (goldPerSecond.value > maxGoldPerSecond.value) maxGoldPerSecond.value = goldPerSecond.value;
                updateAchievements();
                saveGame();
            }
        }

        onMounted(() => {
            loadGame();
            calculateOfflineProgress();
            interval = setInterval(tick, 1000);
            const