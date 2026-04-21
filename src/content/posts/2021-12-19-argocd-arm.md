---
title: "ARM64 클러스터에서 ArgoCD 설치하기"
date: 2021-12-19
categories: [ kubernetes,infra,cicd,argocd ]
---

## 배경

### `ARM64` 클러스터 환경

M1 맥북 때문에 입문한 이후 `ARM64` 아키텍쳐 환경에서 `Docker` 컨테이너를 띄워보다 보면 실행이 실패 할 때 [도커 허브](https://hub.docker.com) 에서 아키텍쳐를 확인하는 버릇이 생겼습니다. 아무래도 `ARM64` 용으로 빌드가 되어 있지 않은 경우 컨테이너가 실행이 안되기 때문인데요. 이번에 `ArgoCD` 를 설치하면서 또 한번 마주하게 되었습니다.

### 가이드대로 설치 시도, 그리고 실패

`ARM64` 클러스터에 [ArgoCD 가이드](https://argo-cd.readthedocs.io/en/stable/getting_started/)대로 설치하면 실패합니다. 원인은 간단합니다. 도커허브에 등록된 [ArgoCD 이미지](https://hub.docker.com/r/argoproj/argocd/tags)가 `linux/amd64` 용 빌드만 있기 때문입니다.

![No images for arm](https://raw.githubusercontent.com/urunimi/urunimi.github.io/main/_posts/2021-12-19/argocd-arm-0.png)

## 해결방법 찾기

보통 이런경우 두가지 방법이 있습니다. 

1. 비슷한 삽질을 한 누군가가 분명히 있을 테니 ARM용 이미지를 구글링 해본다.
2. 직접 프로그램을 ARM64로 컴파일해서 자신 만의 이미지를 생성해서 [도커 허브](https://hub.docker.com)에 업로드한다.

1번 방법을 먼저 시도해봤습니다.

### 이미지 발견

역시 스웨덴의 천사 개발자 한분이 [이슈를 제기](https://github.com/argoproj/argo-cd/issues/2167)했고 직접 이미지를 만들어서 지속적으로 업로드하고 있었습니다. [[도커 허브 링크]](https://hub.docker.com/r/alinbalutoiu/argocd) 

![ArgoCD for Raspberry Pi](https://raw.githubusercontent.com/urunimi/urunimi.github.io/main/_posts/2021-12-19/argocd-arm-1.png)

## Arm용 ArgoCD 설치

### ArgoCD 설치 yaml 수정

ArgoCD 공식 배포 가이드를 따라가다보면 argo-cd 리포지토리에 설치용 yaml 을 관리하고 있는 것을 확인할 수 있습니다. 

![Install Guide](https://raw.githubusercontent.com/urunimi/urunimi.github.io/main/_posts/2021-12-19/argocd-arm-2.png)

저는 core 만 설치해보기로 했고 이를 위한 yaml 은 [이 파일](https://github.com/argoproj/argo-cd/blob/master/manifests/core-install.yaml)이었습니다. 해당 파일을 다운로드 한다음 공식이미지(`quay.io/argoproj/argocd:latest`)를 찾아서 `alinbalutoiu/argocd` 이미지로 변경합니다.

![Argo CD Image](https://raw.githubusercontent.com/urunimi/urunimi.github.io/main/_posts/2021-12-19/argocd-arm-5.png)

### 클러스터에 적용
 
여기서부터는 공식가이드와 동일합니다.

```bash
❯ kubectl apply -n argocd -f core-install.yaml # 수정한 yaml 파일

customresourcedefinition.apiextensions.k8s.io/applications.argoproj.io created
customresourcedefinition.apiextensions.k8s.io/appprojects.argoproj.io created
serviceaccount/argocd-application-controller created
# ...
```

이제 설치상태를 확인합니다.

```bash
❯ kubectl get all -n argocd
NAME                                     READY   STATUS    RESTARTS   AGE
pod/argocd-application-controller-0      1/1     Running   0          26m
pod/argocd-redis-74d8c6db65-7c5sk        1/1     Running   0          26m
pod/argocd-repo-server-bd494f86c-x2n4m   1/1     Running   0          26m

NAME                         TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)             AGE
service/argocd-metrics       ClusterIP   10.96.58.74    <none>        8082/TCP            26m
service/argocd-redis         ClusterIP   10.96.94.118   <none>        6379/TCP            26m
service/argocd-repo-server   ClusterIP   10.96.67.99    <none>        8081/TCP,8084/TCP   26m

NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/argocd-redis         1/1     1            1           26m
deployment.apps/argocd-repo-server   1/1     1            1           26m

NAME                                           DESIRED   CURRENT   READY   AGE
replicaset.apps/argocd-redis-74d8c6db65        1         1         1       26m
replicaset.apps/argocd-repo-server-bd494f86c   1         1         1       26m

NAME                                             READY   AGE
statefulset.apps/argocd-application-controller   1/1     26m
```

수고 많으셨습니다! 👏👏
