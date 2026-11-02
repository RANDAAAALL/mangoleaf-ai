"""Replace only Step 5's code cell in the existing Colab notebook.

Keep the live session and RUN_DIR; do not restart or recreate the attempt.
"""

REVIEWED_IMAGES = [
    {
        "label": "anthracnose",
        "currentName": "verified mango leaf disease 21.jpg",
        "historicalName": "verified mango leaf disease 21.jpg",
        "sha256": "a557157b1e887d6f8f7067efbaa97447074114b2967c3c2337656d1936b45102"
    },
    {
        "label": "anthracnose",
        "currentName": "verified mango leaf disease 20.jpg",
        "historicalName": "verified mango leaf disease 20.jpg",
        "sha256": "87dad59aa6422d959e3fcfffd35ddca9c918e858dd7b220f1e016ae09d741f6f"
    },
    {
        "label": "anthracnose",
        "currentName": "DSC_0119.JPG",
        "historicalName": "DSC_0119.JPG",
        "sha256": "01e6fd123c9ae054d2d904fef25f543279c6c74914d44a33cd9c7488ca2861c6"
    },
    {
        "label": "anthracnose",
        "currentName": "DSC_0488.JPG",
        "historicalName": "DSC_0488.JPG",
        "sha256": "ee9676472204c9cdd0830dce3be63a9d47e646ecb9d2c70126ddcdac063e4ecd"
    },
    {
        "label": "anthracnose",
        "currentName": "DSC_0970.JPG",
        "historicalName": "DSC_0970.JPG",
        "sha256": "8b5d0b0e2500ff762a773b326c6a0a3ab545e51e682a253d3776be738d61123c"
    },
    {
        "label": "anthracnose",
        "currentName": "Anthracnose on young leaves.jpeg",
        "historicalName": "Anthracnose on young leaves.jpeg",
        "sha256": "5c10b4851fd67db6b5a21677e725d124491633afea45186fbe2e2a6f9bd554ec"
    },
    {
        "label": "anthracnose",
        "currentName": "AnthracnoseonMangoLeaf.jpeg",
        "historicalName": "AnthracnoseonMangoLeaf.jpeg",
        "sha256": "52a0fa64a504139aa65e6cbf807ecae21be6f4933bc4c1d5e2d8797a54de7227"
    },
    {
        "label": "sooty_mold",
        "currentName": "IMG_20260219_135000.jpg",
        "historicalName": "IMG_20260219_135000.jpg",
        "sha256": "2a22ee7f89ea03ad9ee924b5815ae71576d6ccd3305576dccc6f3bf00e31fce3"
    },
    {
        "label": "sooty_mold",
        "currentName": "viber_image_2024-11-15_13-17-51-567.jpg",
        "historicalName": "viber_image_2024-11-15_13-17-51-567.jpg",
        "sha256": "d785e72ca8291a194d5f56f2c75d2087ca3fd9728549246b888a3b964ce5b3c9"
    },
    {
        "label": "sooty_mold",
        "currentName": "IMG_20260219_134935.jpg",
        "historicalName": "IMG_20260219_134935.jpg",
        "sha256": "6c1c6c90f2dbfdb3ab1d451b90a9ce2769222aaa237bb820bf55f782e63498d5"
    },
    {
        "label": "sooty_mold",
        "currentName": "DSC_1029.JPG",
        "historicalName": "DSC_1029.JPG",
        "sha256": "7dfd201d72ea78a4557fdc5c5bddb594af538ff0270e020e73c9f382b3fa6f74"
    },
    {
        "label": "sooty_mold",
        "currentName": "724869371_27534362222843583_7670640125862653147_n.jpg",
        "historicalName": "724869371_27534362222843583_7670640125862653147_n.jpg",
        "sha256": "81c5a02299de1f2d66627a0f709a4f0c3235066749f7f8b203840b86f8a93b3c"
    },
    {
        "label": "sooty_mold",
        "currentName": "45a36510-0844-4baa-9795-3de7e0236896.jpg",
        "historicalName": "45a36510-0844-4baa-9795-3de7e0236896.jpg",
        "sha256": "32d90fe257d7ef563ef8166768b638a92a95c8196d33de90ced349c22b62a410"
    },
    {
        "label": "healthy_leaf",
        "currentName": "HealthyLeaf_2.jpg",
        "historicalName": "HealthyLeaf_2.jpg",
        "sha256": "e2e68e23f0fd8f88b999c0740cb577e126e78de61fa1fe71772d908ea2fc6375"
    },
    {
        "label": "healthy_leaf",
        "currentName": "HealthyLeaf_1.jpg",
        "historicalName": "HealthyLeaf_1.jpg",
        "sha256": "90a7907f7a259e404f6bb8c6558bb1081f2d2942249ebb5cac4b747a2f989e0c"
    },
    {
        "label": "mango_scab",
        "currentName": "15289a55-e368-4f61-a25c-85b2468243fd.jpg",
        "historicalName": "15289a55-e368-4f61-a25c-85b2468243fd.jpg",
        "sha256": "5a10c88561c498889b7668319c36fa1a432b942c21832e65d8c4a3063dbcf78b"
    },
    {
        "label": "mango_scab",
        "currentName": "DSC_0281.JPG",
        "historicalName": "DSC_0281.JPG",
        "sha256": "da1e429fc670c52fd75ba8cfe37b019606841ee7e012182f5696895e1ba13132"
    },
    {
        "label": "mango_scab",
        "currentName": "DSC_0966.JPG",
        "historicalName": "DSC_0966.JPG",
        "sha256": "de8cd5a96aefcccbd838a67411d44f13dcf9bf647200e40c71b7da28f26a1724"
    },
    {
        "label": "mango_scab",
        "currentName": "Scab.JPG",
        "historicalName": "Scab.JPG",
        "sha256": "10344e2e95ceeafab7d77e3e28e4ebbdebd699ec7e862c9c011516038e821068"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 70.jpg",
        "historicalName": "non verified mango disease 70.jpg",
        "sha256": "47a8192ddf400d3ba6397ba7d3acb21142d75267b80abe3911ba0d76e85ce995"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 71.jpg",
        "historicalName": "non verified mango disease 71.jpg",
        "sha256": "0c46b7f3c43190fb6e5663d6248f81e1eca31287ea8ab8cf3c2c9113aa46a848"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 73.jpg",
        "historicalName": "non verified mango disease 73.jpg",
        "sha256": "7562eee067e4a968c8f7c1f3281125bcb3546dcab2795f196ee11286e836ac09"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 68.jpg",
        "historicalName": "non verified mango disease 68.jpg",
        "sha256": "281064014381e3f9d4cd163b62ec6e643364ee5a3a0840875f9c310912a30c8d"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 67.jpg",
        "historicalName": "non verified mango disease 67.jpg",
        "sha256": "6e99067feab48b78d0e0c4260e342c1b64673dab00a5c18099310bb9053f1dd7"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 66.jpg",
        "historicalName": "non verified mango disease 66.jpg",
        "sha256": "0e515243d9cec0d0e1f970d4ba79081606c2280ee02176e30fa24b2817784cda"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 65.jpg",
        "historicalName": "non verified mango disease 65.jpg",
        "sha256": "ae4bfcc5cd3eba0f652aa4355d1780ef6efe27af71f3d020a15b1eee2c0f975b"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 56.jpg",
        "historicalName": "non verified mango disease 56.jpg",
        "sha256": "ad4415243dc86b38c7ac7f529fdb2e09f7fc9410ded477a553a0f33ef02736fa"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 53.jpg",
        "historicalName": "non verified mango disease 53.jpg",
        "sha256": "89652a16e8c0590a4fd51b9ff66c7ff9fb95a7ded8aece63c85565dad39f5fff"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 52.jpg",
        "historicalName": "non verified mango disease 52.jpg",
        "sha256": "cfb52caae3133082bc5f70c82f4b4c73589a65087409383e87453d405648391e"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 51.jpg",
        "historicalName": "non verified mango disease 51.jpg",
        "sha256": "e2c7e67b3026efe9eac0941272a41654f54c8317a2d11d7ba0eb81699891a2bd"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 49.jpg",
        "historicalName": "non verified mango disease 49.jpg",
        "sha256": "7b87cb61eb26ffffde585b8cbb254795f0da834ce1c306bae76fe2b6cdf0f736"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 11.jpg",
        "historicalName": "non verified mango disease 11.jpg",
        "sha256": "81a2f9abde6762ed891db43c570a5339d465682e3817c4f79917f8f497ed77cd"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 10.jpg",
        "historicalName": "verified mango disease 10.jpg",
        "sha256": "afcb278a84a3abf145a2d396bbcfa99b5818b217764c3fef07246d6993421095"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 9.jpg",
        "historicalName": "verified mango disease 9.jpg",
        "sha256": "6fdc1ff1319c85198ae2d42978e9c3ec11ee82b754e982915a3df896e922e187"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 1.jpg",
        "historicalName": "verified mango disease 1.jpg",
        "sha256": "156d089cee4c22e7256a0aa6ef48c84025507fcafda3b463fe39f9d9f852cd87"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 58.jpg",
        "historicalName": "verified mango disease 58.jpg",
        "sha256": "7fe031c22293d0c980ddf2744d2b3732bcbe22c659281c67ef7f24ce577619c6"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 36.jpg",
        "historicalName": "verified mango disease 36.jpg",
        "sha256": "22deb301d133db0af636c788508379203b6b90e4ca3ce9aa3ce238069cccfc4e"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 32.jpg",
        "historicalName": "verified mango disease 32.jpg",
        "sha256": "bbfbb925ba9bc8cb2595d501ab8180bc7378dfb199a1110793743e79a40e376f"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 6.jpg",
        "historicalName": "verified mango disease 6.jpg",
        "sha256": "262ea4d6d82594a4333470180b3de1a77560fafc3acc1e0a75144260e1928e15"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 2.jpg",
        "historicalName": "verified mango disease 2.jpg",
        "sha256": "1da80fe4b68725c7c39d78af8e4a42c65316c4e29d2be3756bef74c02a51d1d0"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 63.jpg",
        "historicalName": "verified mango disease 63.jpg",
        "sha256": "95e7184c9c0c2c0f5e729d16513410470c77e07bc4a787d50c06f79a55977cd8"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 57.jpg",
        "historicalName": "verified mango disease 57.jpg",
        "sha256": "9c9bc581355a1a4bfcd0befe2051135b7903d219df9320587cd88a28c94db5f6"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 7.jpg",
        "historicalName": "verified mango disease 7.jpg",
        "sha256": "0a7326dd87f77caad7cae79d709bd7cdfcb5a0aec2ef96463782b2920b5cb55c"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 55.jpg",
        "historicalName": "verified mango disease 55.jpg",
        "sha256": "d70902b669201181ee27847a13e4bbf684a371c18957b2cbb20b6cfcbf75275a"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 45.jpg",
        "historicalName": "verified mango disease 45.jpg",
        "sha256": "0827d4061caffa787cb8fab501fb3f25f6e4ef40f434ee03787136b0c8f2d4b7"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 54.jpg",
        "historicalName": "verified mango disease 54.jpg",
        "sha256": "4eee0b91cfa3f2c5b66a0f334d2d2e487fd666d7aa10b3ea9f8bdfc9d36dbfea"
    },
    {
        "label": "mango_scab",
        "currentName": "verified mango disease 8.jpg",
        "historicalName": "verified mango disease 8.jpg",
        "sha256": "00239798d21836b06afea3d213aff445d509eabab9cfa5515e687afc20447e97"
    },
    {
        "label": "mango_scab",
        "currentName": "DSC_1014.JPG",
        "historicalName": "DSC_1014.JPG",
        "sha256": "348841118bd2fed6966a5837ddd7dcde55cb053057371a39ce4f051aa5627bdf"
    },
    {
        "label": "mango_scab",
        "currentName": "Scab1.JPG",
        "historicalName": "Scab1.JPG",
        "sha256": "dbf4ee9f20018da3f04c542d9b369403bb8fbf0149b36c14a4363782d68d174e"
    },
    {
        "label": "mango_scab",
        "currentName": "725146731_2449764938863852_7559841505625140608_n.jpg",
        "historicalName": "725146731_2449764938863852_7559841505625140608_n.jpg",
        "sha256": "a86e5a775f479a63fe2528305bc350300435f8b048494a06ae13e1fd78d0d0f5"
    },
    {
        "label": "healthy_fruit",
        "currentName": "DSC_1021.JPG",
        "historicalName": "DSC_1021.JPG",
        "sha256": "9872562f0d3dfe137e0db5edfbaeaa602aef7444aacded8d18ce9de1bfbf5390"
    },
    {
        "label": "healthy_fruit",
        "currentName": "DSC_1019.JPG",
        "historicalName": "DSC_1019.JPG",
        "sha256": "f744b6410bd2ba2897372201bd1179144fbcb6860e11cf2ba083e1fc8e4f1d9e"
    },
    {
        "label": "healthy_fruit",
        "currentName": "DSC_0436.JPG",
        "historicalName": "DSC_0436.JPG",
        "sha256": "7053f37a4c34867f2c77d44ca764def21315667a24ce4cf388586a6be866d458"
    },
    {
        "label": "healthy_fruit",
        "currentName": "DSC_0205.JPG",
        "historicalName": "DSC_0205.JPG",
        "sha256": "0a1ab9392878b940fc828aa7e7659b0ee2897244935f0dd57e8e012384c9cc53"
    },
    {
        "label": "healthy_fruit",
        "currentName": "DSC_0204.JPG",
        "historicalName": "DSC_0204.JPG",
        "sha256": "5e832bc5a93f67dda12f79405fa39e89f7208052bb5ee6e627711967c6ee668c"
    },
    {
        "label": "healthy_fruit",
        "currentName": "DSC_0201 (1).JPG",
        "historicalName": "DSC_0201 (1).JPG",
        "sha256": "84e0237792a86d60a92e12a4da910e7bfe20f60439aff39f3534d6eaeb1c35f4"
    },
    {
        "label": "healthy_fruit",
        "currentName": "727799974_830567853245491_1446073817623999359_n.jpg",
        "historicalName": "727799974_830567853245491_1446073817623999359_n.jpg",
        "sha256": "9e0436c4d16f0517ffb395477f0567ff046fd41d04311ae74c1abb224c496504"
    },
    {
        "label": "healthy_fruit",
        "currentName": "725318273_1696519271391031_8474708639771176175_n.jpg",
        "historicalName": "725318273_1696519271391031_8474708639771176175_n.jpg",
        "sha256": "18c047f48c6deb7b423919369488485c608300cbba79d078428954694073ba4f"
    },
    {
        "label": "healthy_fruit",
        "currentName": "723960758_2381115535716542_3913785565978577803_n.jpg",
        "historicalName": "723960758_2381115535716542_3913785565978577803_n.jpg",
        "sha256": "3fb605dbbc492f8466267cbb8ec52ceede4455c676dc54a66db37b7e909ed644"
    },
    {
        "label": "healthy_fruit",
        "currentName": "723624552_976005712089787_680463173797746853_n.jpg",
        "historicalName": "723624552_976005712089787_680463173797746853_n.jpg",
        "sha256": "bccae50356a84611268b9fd0b5f5bf5517b222ac223d298084b121e169550b64"
    },
    {
        "label": "healthy_fruit",
        "currentName": "723624552_976005712089787_680463173797746853_n_2.jpg",
        "historicalName": "723624552_976005712089787_680463173797746853_n_2.jpg",
        "sha256": "b1c8ddc707402b023f61be78b900eb878af012c14964e1dbf25b7aab060c2310"
    },
    {
        "label": "healthy_fruit",
        "currentName": "719671069_1291039922786074_6951448894192280220_n.jpg",
        "historicalName": "719671069_1291039922786074_6951448894192280220_n.jpg",
        "sha256": "61cabb3193580b025925fe0177dfdf9a62cf7ea19a18df33218c41842349439c"
    }
]


def exact_representatives(rows, protected_hashes=None, preferred_names=None):
    """Choose exact-pixel representatives without relabeling images."""
    protected_hashes = protected_hashes or set()
    preferred_names = preferred_names or {}
    decoded = defaultdict(list)
    for row in rows:
        decoded[row['decodedRgbSha256']].append(row)
    retained = []
    audit = []
    for fingerprint, group in sorted(decoded.items()):
        labels = {row.get('label') for row in group}
        if len(labels) != 1:
            raise RuntimeError('Exact decoded image has conflicting class labels: ' + str([row['sourceRelativePath'] for row in group]))
        protected = {row['sha256'] for row in group if row['sha256'] in protected_hashes}
        if len(protected) > 1:
            raise RuntimeError('Two protected distinct identities have identical decoded pixels; explicit conflict resolution required.')
        chosen = min(group, key=lambda row: (
            row['sha256'] not in protected_hashes,
            Path(row['sourceRelativePath']).name != preferred_names.get(row.get('label')),
            row['sourceRelativePath'],
        ))
        retained.append(dict(chosen))
        if len(group) > 1:
            audit.append({'keptId': chosen['id'], 'copies': portable_rows(group)})
    if not protected_hashes.issubset({row['sha256'] for row in retained}):
        raise RuntimeError('Exact-copy reduction would remove a protected reviewed fingerprint.')
    return retained, audit


def connected_groups(rows, pairs, distinct_pairs, extra_groups):
    """Keep related captures together using reviewed pair decisions."""
    parents = {row['id']: row['id'] for row in rows}

    def root(key):
        """Find the representative of a related-image group."""
        while parents[key] != key:
            parents[key] = parents[parents[key]]
            key = parents[key]
        return key

    def join(left, right):
        """Merge related groups without splitting their identities."""
        first, second = root(left), root(right)
        parents[max(first, second)] = min(first, second)

    audited = {tuple(sorted((pair['firstId'], pair['secondId']))) for pair in pairs}
    distinct = {tuple(sorted(pair)) for pair in distinct_pairs}
    if any(len(pair) != 2 for pair in distinct_pairs) or not distinct.issubset(audited):
        raise ValueError('Distinct decisions must name complete audited pairs.')
    for pair in audited - distinct:
        join(*pair)
    for group in extra_groups:
        if len(group) < 2 or any(key not in parents for key in group):
            raise ValueError('Related-capture groups require at least two known image IDs.')
        for key in group[1:]:
            join(group[0], key)
    return {key: root(key) for key in parents}



def new_similarity_pairs(new_images, other_images, same_pool=False):
    """Review new relationships without redoing the old visual screening."""
    flags = []
    for index, first in enumerate(new_images):
        candidates = other_images[index + 1:] if same_pool else other_images
        for second in candidates:
            if first['id'] == second['id']:
                continue
            distance = (int(first['phash'], 16) ^ int(second['phash'], 16)).bit_count()
            exact = first['sha256'] == second['sha256'] or first['decodedRgbSha256'] == second['decodedRgbSha256']
            if exact or distance <= PHASH_DISTANCE:
                flags.append({'firstId': first['id'], 'secondId': second['id'], 'distance': distance,
                              'exact': exact, 'firstPath': first['sourceRelativePath'],
                              'secondPath': second['sourceRelativePath'], 'secondPool': second['pool']})
    return flags


def assert_disjoint_pools(pools):
    """Reject exact file/pixel identity leakage across scientific pools."""
    for index, (name, first) in enumerate(pools):
        for field in ('sha256', 'decodedRgbSha256'):
            values = [row[field] for row in first]
            if len(values) != len(set(values)):
                raise RuntimeError('Duplicate ' + field + ' inside ' + name)
            for second_name, second in pools[index + 1:]:
                if set(values) & {row[field] for row in second}:
                    raise RuntimeError('Exact overlap between ' + name + ' and ' + second_name)


assert_disjoint_pools([('mango', raw_rows + new_rows), ('OE', approved_oe_rows), ('reporting OOD', held_out_ood_rows)])
new_mango_flags = new_similarity_pairs(new_rows, new_rows, same_pool=True) + new_similarity_pairs(new_rows, raw_rows)
new_cross_flags = new_similarity_pairs(new_rows, approved_oe_rows + held_out_ood_rows)
drifted_mango = [row for row in raw_rows if row.get('referencePhash', row['phash']) != row['phash']]
drifted_oe = [row for row in approved_oe_rows if row.get('referencePhash', row['phash']) != row['phash']]
drifted_reporting = [row for row in held_out_ood_rows if row.get('referencePhash', row['phash']) != row['phash']]
# Revisit every old boundary affected by changed derived fingerprints; do not
# silently reuse an old similarity review under a different representation.
new_mango_flags += new_similarity_pairs(drifted_mango, raw_rows + new_rows)
new_cross_flags += new_similarity_pairs(drifted_mango, approved_oe_rows + held_out_ood_rows)
new_cross_flags += new_similarity_pairs(drifted_oe, raw_rows + new_rows + held_out_ood_rows)
new_cross_flags += new_similarity_pairs(drifted_reporting, raw_rows + new_rows + approved_oe_rows)
new_mango_flags = list({tuple(sorted((row['firstId'], row['secondId']))): row for row in new_mango_flags}.values())
new_cross_flags = list({tuple(sorted((row['firstId'], row['secondId']))): row for row in new_cross_flags}.values())
save_json_once(RUN_DIR / 'duplicate_audit.json', {'newMangoPairs': new_mango_flags, 'newCrossPoolPairs': new_cross_flags,
    'oldMembershipVerified': True, 'historicalScreeningReused': True,
    'changedHistoricalPhashCounts': {'mango': len(drifted_mango), 'oe': len(drifted_oe), 'reporting': len(drifted_reporting)},
    'limits': 'Hash checks do not identify all related captures or establish cultivar/label validity.'})
flagged_ids = {row[key] for row in new_mango_flags + new_cross_flags for key in ('firstId', 'secondId')}
save_contact_sheets([r for r in raw_rows + new_rows + approved_oe_rows + held_out_ood_rows if r['id'] in flagged_ids],
                    RUN_DIR / 'new_similarity_previews', 'V5.1.0 new-photo similarity candidates')
reviewed_hashes = {row['sha256'] for row in REVIEWED_IMAGES}
if not reviewed_hashes.issubset({row['sha256'] for row in raw_rows}):
    raise RuntimeError('A historical reviewed identity is missing.')
save_json_once(RUN_DIR / 'reviewed_images.json', REVIEWED_IMAGES)
print('New mango similarity pairs:', len(new_mango_flags), 'new cross-pool candidates:', len(new_cross_flags))
